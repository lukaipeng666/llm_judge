package admin

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// GetUsers returns all users
func GetUsers(c *gin.Context) {
	users, err := repository.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

// DeleteUser deletes a user
func DeleteUser(c *gin.Context) {
	currentUserID := c.GetInt("user_id")
	userID := c.Param("user_id")

	var id int
	if _, err := fmt.Sscanf(userID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid user ID"})
		return
	}

	// Prevent deleting self
	if id == currentUserID {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Cannot delete self"})
		return
	}

	success, err := repository.DeleteUser(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAllTasks returns all tasks
func GetAllTasks(c *gin.Context) {
	tasks, err := repository.GetAllTasksGlobal()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// TerminateTask terminates a task
func TerminateTask(c *gin.Context) {
	taskID := c.Param("task_id")

	// TODO: Terminate running process

	// Update task status
	updates := map[string]interface{}{
		"status":  "cancelled",
		"message": "Task terminated by admin",
	}
	success, err := repository.UpdateUserTask(taskID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task terminated successfully"})
}

// GetAllData returns all data files
func GetAllData(c *gin.Context) {
	data, err := repository.GetAllDataGlobal()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// DeleteUserData deletes user data
func DeleteUserData(c *gin.Context) {
	userID := c.Param("user_id")
	dataID := c.Param("data_id")

	var uid, did int
	if _, err := fmt.Sscanf(userID, "%d", &uid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid user ID"})
		return
	}
	if _, err := fmt.Sscanf(dataID, "%d", &did); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid data ID"})
		return
	}

	success, err := repository.DeleteUserData(uid, did)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Data file not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data file deleted successfully"})
}
