package model

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// GetScoringFunctions returns available scoring functions
func GetScoringFunctions(c *gin.Context) {
	// TODO: Return actual scoring functions from registry
	scoringFunctions := []string{
		"rouge",
		"exact_match",
		"toolbench_evaluation",
		"ifeval",
		"math_verification",
		"code_check",
		"safety_check",
	}

	c.JSON(http.StatusOK, gin.H{
		"scoring_functions": scoringFunctions,
	})
}

// GetAvailableModels returns available models from user history
func GetAvailableModels(c *gin.Context) {
	userID := c.GetInt("user_id")

	reports, err := repository.GetUserReports(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Extract unique models
	modelMap := make(map[string]bool)
	for _, report := range reports {
		if report.Model != "" {
			modelMap[report.Model] = true
		}
	}

	models := make([]string, 0, len(modelMap))
	for modelName := range modelMap {
		models = append(models, modelName)
	}

	c.JSON(http.StatusOK, gin.H{"models": models})
}

// GetModelConfigs returns model configs (for regular users)
func GetModelConfigs(c *gin.Context) {
	includeInactive := c.DefaultQuery("include_inactive", "false") == "true"

	configs, err := repository.GetAllModelConfigs(includeInactive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Fix null api_urls to empty array
	for i := range configs {
		if configs[i].APIUrls == nil {
			configs[i].APIUrls = []string{}
		}
	}

	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

// AdminGetModelConfigs returns all model configs (admin)
func AdminGetModelConfigs(c *gin.Context) {
	configs, err := repository.GetAllModelConfigs(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Fix null api_urls to empty array
	for i := range configs {
		if configs[i].APIUrls == nil {
			configs[i].APIUrls = []string{}
		}
	}

	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

// CreateModelConfig creates a model config (admin)
func CreateModelConfig(c *gin.Context) {
	var req model.ModelConfigCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	configID, err := repository.CreateModelConfig(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"config_id": configID,
		"message":   "Model config created successfully",
	})
}

// UpdateModelConfig updates a model config (admin)
func UpdateModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	var id int
	if _, err := fmt.Sscanf(configID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid config ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	success, err := repository.UpdateModelConfig(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Model config not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Model config updated successfully"})
}

// DeleteModelConfig deletes a model config (admin)
func DeleteModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	var id int
	if _, err := fmt.Sscanf(configID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid config ID"})
		return
	}

	success, err := repository.DeleteModelConfig(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Model config not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Model config deleted successfully"})
}
