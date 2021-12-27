package desktop

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"

	"github.com/stashapp/stash/pkg/logger"
	"github.com/stashapp/stash/pkg/manager/config"
)

const COOKIEFILE_NAME = "stash_update.pid"

func startSelfUpdate() {
	// TODO
}

// SelfUpdateFirstLaunchHandling is always called during app launch. It will checking to see if
// it is the new executable of a self-update process, by check if a self-update cookie file is present.
// if it is, it will signal to the old process to close the database and terminate, then delete the old executable.
// The cookie file is a regular file named stash_update.pid in the config folder, that contains a string of the old version's PID.
func SelfUpdateFirstLaunchHandling() {
	cookiePath := filepath.Join(config.GetInstance().GetConfigPath(), COOKIEFILE_NAME)
	_, err := os.Stat(cookiePath)
	if errors.Is(err, os.ErrNotExist) {
		return
	} else {
		// read file, send sigusr1, delete executable, delete cookie
		content, err := ioutil.ReadFile(cookiePath)
		if err != nil {
			logger.Errorf("Could not read self-update cookie: %s", err.Error())
			return
		}
		pid, err := strconv.Atoi(string(content))
		if err != nil {
			logger.Errorf("Cookie contents invalid: %s", err.Error())
			return
		}
		oldProcess, _ := os.FindProcess(pid)
		oldProcess.Signal(os.Interrupt)
		executable, err := os.Executable()
		if err != nil {
			logger.Errorf("Could not find executable: %s", err.Error())
		}
		executable, _ = filepath.EvalSymlinks(executable)
		err = os.Remove(executable + ".old")
		if err != nil {
			logger.Error("Error deleting old executable: %s", err.Error())
		}
	}
}

func leaveSelfUpdateCookie() {
	cookiePath := filepath.Join(config.GetInstance().GetConfigPath(), COOKIEFILE_NAME)
	ioutil.WriteFile(cookiePath, []byte(fmt.Sprint(os.Getpid())), 0644)
}
