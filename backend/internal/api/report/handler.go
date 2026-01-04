package report

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// GetReports returns all reports for current user
func GetReports(c *gin.Context) {
	userID := c.GetInt("user_id")

	reports, err := repository.GetUserReports(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reports": reports})
}

// GetReportDetail returns report detail
func GetReportDetail(c *gin.Context) {
	userID := c.GetInt("user_id")
	dataset := c.Query("dataset")
	model := c.Query("model")

	if dataset == "" || model == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "dataset and model are required"})
		return
	}

	report, err := repository.GetUserReportByPath(userID, dataset, model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if report == nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Report not found or access denied"})
		return
	}

	// Parse report content
	var reportContent interface{}
	if err := json.Unmarshal([]byte(report.ReportContent), &reportContent); err != nil {
		// If parsing fails, return raw string
		c.JSON(http.StatusOK, report.ReportContent)
		return
	}

	c.JSON(http.StatusOK, reportContent)
}

// DeleteReport deletes a report
func DeleteReport(c *gin.Context) {
	userID := c.GetInt("user_id")
	reportID := c.Param("report_id")

	var id int
	if _, err := fmt.Sscanf(reportID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid report ID"})
		return
	}

	success, err := repository.DeleteUserReport(userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Report not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report deleted successfully"})
}
