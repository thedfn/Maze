  // Importing sdk functions
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { getStorage, ref, uploadBytes } from "firebase/storage";
  import { mazeConfigurations } from './mazes.js';

  // Firebase configuration
  const firebaseConfig = {
   CORRECT FIREBASE CONFIG IN MY VERSION 
  };


  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  // Get references to the necessary elements
  const playerCodeInput = document.getElementById('player-code');
  const startButton = document.getElementById('start-button');

  let sessionId = Date.now().toString();
  let currentMaze = null;
  let playerPosition = { row: 0, col: 0 };
  let timerInterval = null;
  let timeRemaining = 300; // 5 minutes in seconds
  let totalPoints = 0;

const availableMazes = [...mazeConfigurations];
 
  // Function to update the maze display
  function updateMazeDisplay() {
    const mazeElement = document.getElementById('maze');
    mazeElement.innerHTML = '';

    for (let row = 0; row < currentMaze.length; row++) {
      for (let col = 0; col < currentMaze[row].length; col++) {
        const cell = currentMaze[row][col];
        const cellElement = document.createElement('span');
        cellElement.textContent = cell;
        mazeElement.appendChild(cellElement);
      }
      mazeElement.appendChild(document.createElement('br'));
    }
  }
  // Function to load and display the current maze
  function loadMaze() {
    if (availableMazes.length === 0) {
      showGameCompletionScreen();
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableMazes.length);
    const selectedMaze = availableMazes[randomIndex];
    availableMazes.splice(randomIndex, 1); // Remove the selected maze from the availableMazes array

    currentMaze = selectedMaze.layout;
    const mazeElement = document.getElementById('maze');
    mazeElement.innerHTML = '';

    for (let row = 0; row < currentMaze.length; row++) {
      for (let col = 0; col < currentMaze[row].length; col++) {
        const cell = currentMaze[row][col];
        const cellElement = document.createElement('span');
        cellElement.textContent = cell === 'S' ? '🚶' : cell;
        mazeElement.appendChild(cellElement);
      }
      mazeElement.appendChild(document.createElement('br'));
    }

    // Find the starting position
    for (let row = 0; row < currentMaze.length; row++) {
      for (let col = 0; col < currentMaze[row].length; col++) {
        if (currentMaze[row][col] === 'S') {
          playerPosition = { row, col };
          break;
        }
      }
    }

    startTimer();
  }

  // Function to handle player movement
function movePlayer(direction) {
  if (currentMaze === null) {
    console.error('Current maze is not loaded.');
    return;
  }

  const { row, col } = playerPosition;
  let newRow = row;
  let newCol = col;

  switch (direction) {
    case 'up':
      newRow--;
      break;
    case 'down':
      newRow++;
      break;
    case 'left':
      newCol--;
      break;
    case 'right':
      newCol++;
      break;
  }

  if (
    newRow >= 0 &&
    newRow < currentMaze.length &&
    newCol >= 0 &&
    newCol < currentMaze[0].length &&
    currentMaze[newRow][newCol] !== 'X'
  ) {
    const oldCell = currentMaze[row][col];
    const newCell = currentMaze[newRow][newCol];

    if (newCell === 'E') {
      handleExit1();
    } else if (newCell === 'X') {
      handleExit2();
    } else {
      currentMaze[row][col] = oldCell === 'S' ? 'S' : ' ';
      currentMaze[newRow][newCol] = 'O';
      playerPosition = { row: newRow, col: newCol };
      updateMazeDisplay();
    }
  }
}




 // Function to handle reaching the first exit
 function handleExit1() {
  stopTimer();
  const message = document.getElementById('message');
  const timeTaken = formatTime(300 - timeRemaining); // Calculate the time taken
  const playerCode = playerCodeInput.value.trim();
  const csvContent = generateCSVContent(playerCode, currentMaze, sessionId, totalPoints, timeTaken);
  const fileName = `${playerCode}_${currentMaze}_${sessionId}.csv`;
  createCSVFile(fileName, csvContent);
  if (currentMaze[playerPosition.row][playerPosition.col] === 'E') {
    message.textContent = 'Congratulations! You reached the first exit.';
    showExitPrompt();
  }
}

   // Function to handle reaching the second exit
   function handleExit2() {
    stopTimer();
    const message = document.getElementById('message');
    const timeTaken = formatTime(300 - timeRemaining); // Calculate the time taken
    const playerCode = playerCodeInput.value.trim();
    const csvContent = generateCSVContent(playerCode, currentMaze, sessionId, totalPoints, timeTaken);
    const fileName = `${playerCode}_${currentMaze}_${sessionId}_2.csv`;
    createCSVFile(fileName, csvContent);
    if (currentMaze[playerPosition.row][playerPosition.col] === 'X') {
      message.textContent = 'Congratulations! You reached the second exit.';
      showExitPrompt2();
    }
  }

  /// Function to show the exit prompt 1 
function showExitPrompt() {
  const message = document.getElementById('message');
  message.innerHTML = `
    <p>Choose an option:</p>
    <button id="exit-option1">Leave the maze (1 point)</button>
    <button id="exit-option2">Continue the maze </button>
  `;

  const exitOption1 = document.getElementById('exit-option1');
  const exitOption2 = document.getElementById('exit-option2');

  exitOption1.addEventListener('click', function() {
    totalPoints += 1;
    loadNextMaze();
  });

  exitOption2.addEventListener('click', function() {
    // Remove the exit prompt and continue the current maze
    message.innerHTML = '';
    resumeTimer();
  });
}

function showExitPrompt2() {
  const message = document.getElementById('message');
  message.innerHTML = `
    <p>Click to continue to next maze</p>
    <button id="exit-option3">Load next maze</button>
  `;

  const exitOption3 = document.getElementById('exit-option3');


  exitOption3.addEventListener('click', function() {
    totalPoints += 3;
    loadNextMaze();
  });
}

  // function to load next maze
  function loadNextMaze() {
    if (availableMazes.length === 0) {
      showGameCompletionScreen();
    } else {
      loadMaze();
    }
  }

  // Function to start the countdown timer
  function startTimer(resume = false) {
    if (!resume) {
      timeRemaining = 300;
    }
    updateTimerDisplay();
  
    timerInterval = setInterval(function() {
      timeRemaining--;
      updateTimerDisplay();
  
      if (timeRemaining <= 0) {
        stopTimer();
        showTimeUpMessage();
      }
    }, 1000);
  }
  function resumeTimer() {
    startTimer(true);
  }

  // Function to stop the countdown timer
  function stopTimer() {
    clearInterval(timerInterval);
  }

  // Function to update the timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${padZero(minutes)}:${padZero(seconds)}`;
    document.getElementById('time').textContent = formattedTime;
  }

  // Function to pad zero to single-digit numbers
  function padZero(number) {
    return number.toString().padStart(2, '0');
  }

  // Function to show the time-up message
  function showTimeUpMessage() {
    const csvContent = generateCSVContent(playerCode, currentMaze, sessionId, totalPoints, '300');
    const fileName = `${playerCode}_${currentMaze}_${sessionId}_timeout.csv`;
    createCSVFile(fileName, csvContent);
    showExitPrompt4();
  }

  function showExitPrompt4() {
    const message = document.getElementById('message');
    message.innerHTML = `
      <p>Time is up. Click when you are ready to continue</p>
      <button id="exit-option4">Load the next maze</button>

    `;
  
    const exitOption4 = document.getElementById('exit-option4');
  
    exitOption4.addEventListener('click', function() {
      totalPoints += 0;
      loadNextMaze();
    });

  // Event listener for arrow key presses
  document.addEventListener('keydown', function(event) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
        movePlayer('up');
        break;
      case 'ArrowDown':
      case 's':
        movePlayer('down');
        break;
      case 'ArrowLeft':
      case 'a':
        movePlayer('left');
        break;
      case 'ArrowRight':
      case 'd':
        movePlayer('right');
        break;
    }
  });

  // Event listener for start button click
  startButton.addEventListener('click', function() {
    const landingPage = document.getElementById('landing-page');
    const mazeContainer = document.getElementById('maze-container');

    landingPage.style.display = 'none';
    mazeContainer.style.display = 'block';

    loadMaze();
  });


  // Function to show the game completion screen
  function showGameCompletionScreen() {
    const gameCompletionContainer = document.getElementById('game-completion-container');
    const totalPointsCompletionElement = document.getElementById('total-points-completion');

    gameCompletionContainer.style.display = 'block';
    totalPointsCompletionElement.textContent = totalPoints;
  }

  // Event listener for continue button click on the game completion screen
  const continueButtonCompletion = document.getElementById('continue-button-completion');
  continueButtonCompletion.addEventListener('click', function() {
    // !!CHANGE REDIRECT URL HERE!!
    window.location.href = 'WEITERLEITUNGSURL.COM';
  });

  // Function to generate CSV file content for a maze
  function generateCSVContent(playerCode, currentMaze, sessionId, points, timeTaken) {
    const csvContent = `Player Code,currentMaze,Session ID,Points,Time Taken\n${playerCode},${currentMaze},${sessionId},${points},${timeTaken}`;
    return csvContent;
  }

  // Function to create a CSV file and upload to Firebase Storage
  function createCSVFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const fileRef = ref(storage, 'csv/' + fileName);
  
    uploadBytes(fileRef, blob).then((snapshot) => {
      console.log('CSV file uploaded successfully to Firebase Storage!');
    }).catch((error) => {
      console.error('Error uploading CSV file to Firebase Storage:', error);
    });
  }

  // Function to format time in MM:SS format
  function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${padZero(minutes)}:${padZero(seconds)}`;
  }
}