package data

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// GetDataFiles returns user's data files
func GetDataFiles(c *gin.Context) {
	userID := c.GetInt("user_id")

	dataList, err := repository.GetUserDataList(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data_files": dataList})
}

// GetDataContent returns data file content
func GetDataContent(c *gin.Context) {
	userID := c.GetInt("user_id")
	dataID := c.Param("data_id")

	var id int
	if _, err := fmt.Sscanf(dataID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid data ID"})
		return
	}

	data, err := repository.GetUserDataByID(userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if data == nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Data file not found or access denied"})
		return
	}

	// Parse JSONL content
	lines := strings.Split(data.FileContent, "\n")
	var jsonlData []interface{}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var item interface{}
		if err := json.Unmarshal([]byte(line), &item); err != nil {
			c.JSON(http.StatusOK, model.DataContentResponse{
				Filename:    data.Filename,
				Description: data.Description,
				TotalCount:  len(lines),
				Data:        jsonlData,
				Error:       fmt.Sprintf("Failed to parse line: %s", err.Error()),
			})
			return
		}
		jsonlData = append(jsonlData, item)
	}

	c.JSON(http.StatusOK, model.DataContentResponse{
		Filename:    data.Filename,
		Description: data.Description,
		TotalCount:  len(jsonlData),
		Data:        jsonlData,
	})
}

// ValidateCSV validates CSV and converts to JSONL preview
func ValidateCSV(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "File is required"})
		return
	}

	if !strings.HasSuffix(file.Filename, ".csv") {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Only .csv files are supported"})
		return
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	defer src.Close()

	// Read CSV
	reader := csv.NewReader(src)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "CSV file must have at least a header row and one data row"})
		return
	}

	// Validate and convert
	validationInfo := model.CSVValidationInfo{
		TotalRows:  len(records),
		ValidRows:  0,
		EmptyRows:  0,
		HeadersInfo: map[string]interface{}{
			"headers": records[0],
		},
		Warnings:   []string{},
		InvalidRows: []map[string]interface{}{},
		Errors:     []string{},
	}

	var jsonlData []interface{}

	for i, row := range records[1:] {
		if len(row) == 0 || (len(row) == 1 && strings.TrimSpace(row[0]) == "") {
			validationInfo.EmptyRows++
			continue
		}

		// Check if meta column exists
		if len(row) < 2 || row[0] != "meta" {
			validationInfo.InvalidRows = append(validationInfo.InvalidRows, map[string]interface{}{
				"row": i + 2,
				"data": row,
				"error": "First column must be 'meta'",
			})
			continue
		}

		// Convert to JSONL
		jsonlItem, err := convertCSVRowToJSONL(row)
		if err != nil {
			validationInfo.InvalidRows = append(validationInfo.InvalidRows, map[string]interface{}{
				"row": i + 2,
				"data": row,
				"error": err.Error(),
			})
			continue
		}

		jsonlData = append(jsonlData, jsonlItem)
		validationInfo.ValidRows++
	}

	if len(validationInfo.Errors) > 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "CSV file validation failed",
			"validation": validationInfo,
			"preview_data": []interface{}{},
		})
		return
	}

	// Return preview (first 5 items)
	previewCount := 5
	if len(jsonlData) < previewCount {
		previewCount = len(jsonlData)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "CSV file validated successfully",
		"validation": validationInfo,
		"preview_data": jsonlData[:previewCount],
	})
}

// UploadData handles data file upload
func UploadData(c *gin.Context) {
	userID := c.GetInt("user_id")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "File is required"})
		return
	}

	description := c.PostForm("description")

	// Open file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	defer src.Close()

	// Read content
	var fileContent string
	filename := file.Filename

	if strings.HasSuffix(filename, ".jsonl") {
		// Read JSONL directly
		content := make([]byte, file.Size)
		if _, err := src.Read(content); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
			return
		}
		fileContent = string(content)

		// Validate JSONL format
		lines := strings.Split(fileContent, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			var item interface{}
			if err := json.Unmarshal([]byte(line), &item); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSONL format"})
				return
			}
		}

	} else if strings.HasSuffix(filename, ".csv") {
		// Convert CSV to JSONL
		reader := csv.NewReader(src)
		records, err := reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
			return
		}

		var jsonlItems []string
		for _, row := range records[1:] {
			if len(row) < 2 || strings.TrimSpace(row[0]) == "" {
				continue
			}
			jsonlItem, err := convertCSVRowToJSONL(row)
			if err != nil {
				continue
			}
			jsonBytes, _ := json.Marshal(jsonlItem)
			jsonlItems = append(jsonlItems, string(jsonBytes))
		}

		fileContent = strings.Join(jsonlItems, "\n")
		filename = strings.Replace(filename, ".csv", ".jsonl", 1)

	} else {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Only .jsonl and .csv files are supported"})
		return
	}

	// Create database record
	dataID, err := repository.CreateUserData(userID, filename, fileContent, description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": dataID,
		"filename": filename,
		"size": len(fileContent),
		"description": description,
		"message": "File uploaded successfully",
	})
}

// UpdateDataInfo updates data description
func UpdateDataInfo(c *gin.Context) {
	userID := c.GetInt("user_id")
	dataID := c.Param("data_id")

	var id int
	if _, err := fmt.Sscanf(dataID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid data ID"})
		return
	}

	var req model.UserDataUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	success, err := repository.UpdateUserData(userID, id, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Data file not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data file updated successfully"})
}

// DeleteData deletes a data file
func DeleteData(c *gin.Context) {
	userID := c.GetInt("user_id")
	dataID := c.Param("data_id")

	var id int
	if _, err := fmt.Sscanf(dataID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid data ID"})
		return
	}

	success, err := repository.DeleteUserData(userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Data file not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data file deleted successfully"})
}

// GetDataFilesList returns data files list (for frontend compatibility)
func GetDataFilesList(c *gin.Context) {
	userID := c.GetInt("user_id")

	dataList, err := repository.GetUserDataList(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	files := []model.DataFile{}
	for _, data := range dataList {
		files = append(files, model.DataFile{
			ID:          data.ID,
			Name:        data.Filename,
			Size:        data.FileSize,
			Type:        "user",
			Description: data.Description,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data_files": files})
}

// convertCSVRowToJSONL converts a CSV row to JSONL format
func convertCSVRowToJSONL(row []string) (map[string]interface{}, error) {
	if len(row) < 2 {
		return nil, fmt.Errorf("invalid row format")
	}

	item := map[string]interface{}{
		"meta": map[string]interface{}{
			"meta_description": row[1],
		},
		"turns": []interface{}{},
	}

	// Process pairs of Human/Assistant columns
	turns := []interface{}{}
	for i := 2; i+1 < len(row); i += 2 {
		if row[i] != "" && row[i+1] != "" {
			turns = append(turns, map[string]string{
				"role": "Human",
				"text": row[i],
			})
			turns = append(turns, map[string]string{
				"role": "Assistant",
				"text": row[i+1],
			})
		}
	}
	item["turns"] = turns

	return item, nil
}
