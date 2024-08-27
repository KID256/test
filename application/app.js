const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // 引入 exec 以運行 shell 指令

const app = express();
const port = 3000;

// 設置靜態文件夾,用於提供圖像文件
app.use(express.static(path.join(__dirname, 'public')));

// 根路由,提供 HTML 頁面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 獲取圖片的路由
app.get('/get-image', (req, res) => {
  const imagePath = path.join(__dirname, 'public', 'captured_image.jpg');
  
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.redirect('https://fakeimg.pl/640x480/?text=Loading');
    } else {
      res.sendFile(imagePath);
    }
  });
});

// 執行指令的路由
app.get('/execute-command', (req, res) => {
  const command = req.query.command; // 從查詢參數中獲取指令

  if (!command) {
    return res.status(400).send('Command is required');
  }

  // 切換目錄並執行指令
  exec(`cd ../kernel && ${command}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).send(`Error: ${stderr}`);
    }

    console.log(`Command executed: ${command}`);

    // 如果指令是 make，則執行 insmod
    if (command === 'make') {
      exec('cd ../kernel && sudo insmod motion_sensor.ko', (insmodError, insmodStdout, insmodStderr) => {
        if (insmodError) {
          console.error(`Error executing insmod: ${insmodError.message}`);
          return res.status(500).send(`Error loading module: ${insmodStderr}`);
        }
        console.log('Module loaded successfully');
        return res.send(`Output: ${stdout}\nModule loaded successfully: ${insmodStdout}`);
      });
    } 
    // 如果指令是 make clean，則執行 rmmod
    else if (command === 'make clean') {
      exec('cd ../kernel && sudo rmmod motion_sensor', (rmmodError, rmmodStdout, rmmodStderr) => {
        if (rmmodError) {
          console.error(`Error executing rmmod: ${rmmodError.message}`);
          return res.status(500).send(`Error unloading module: ${rmmodStderr}`);
        }
        console.log('Module unloaded successfully');
        return res.send(`Output: ${stdout}\nModule unloaded successfully: ${rmmodStdout}`);
      });
    } 
  });
});

// 新增路由來執行 sudo ./user_program
app.get('/run-user-program', (req, res) => {
  exec('cd ../system && sudo ./user_program', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing user_program: ${error.message}`);
      return res.status(500).send(`Error running user_program: ${stderr}`);
    }
    console.log('user_program executed successfully');
    return res.send(`Output: ${stdout}`);
  });
});

// 新增路由來終止 user_program
app.get('/terminate-user-program', (req, res) => {
  exec('sudo killall -9 user_program', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error terminating user_program: ${error.message}`);
      console.error(`stderr: ${stderr}`); // 打印錯誤輸出
      return res.status(500).send(`Error terminating user_program: ${stderr}`);
    }
    console.log('user_program terminated successfully');
    return res.send('user_program terminated successfully');
  });
});

// 啟動服務器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});