const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Variables
const width = window.innerWidth - 4; // -4 to remove the horizontal scrollbar
const height = window.innerHeight - 4; // -4 to remove the vertical scrollbar
const cellsHorizontal = 14;
const cellsVertical = 7;
const unitWidthX = width / cellsHorizontal;
const unitHeightY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0; // disables gravity
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  // top
  Bodies.rectangle(width / 2, 0, width, 2, {
    isStatic: true,
  }),
  // bottom
  Bodies.rectangle(width / 2, height, width, 2, {
    isStatic: true,
  }),
  // left
  Bodies.rectangle(0, height / 2, 2, height, {
    isStatic: true,
  }),
  // right
  Bodies.rectangle(width, height / 2, 2, height, {
    isStatic: true,
  }),
];
World.add(world, walls);

// Maze generation

// Shuffling helper function for randomizing the order of neighbor cells in an array
const shuffle = (arr) => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter]; // temporarely store the value of the first of the two arrays
    arr[counter] = arr[index]; // assign the second array to the position of the first one
    arr[index] = temp; // assign the first array to the position of the second one
  }
  return arr;
};

// Grid
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

// Verticals
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

// Horizontals
const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

// Starting point
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// Maze generation algorithm
const stepThroughCell = (row, column) => {
  // If I have visited the cell at [row, column], then return
  if (grid[row][column] === true) {
    return;
  }

  // Mark this cell as being visited
  grid[row][column] = true;

  // Assemble a randomly ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"], // top neighbor
    [row, column + 1, "right"], // right neighbor
    [row + 1, column, "down"], // bottom neighbor
    [row, column - 1, "left"], //left neighbor
  ]);

  // For each neighbor...
  for (let neighbor of neighbors) {
    // see if neighbor is out of bounds
    const [nextRow, nextColumn, direction] = neighbor;
    // checking left, right, up and down bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue; // skip to the next neighbor
    }

    // if we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn] === true) {
      continue; // skip to the next neighbor
    }

    // remove a wall from either horizontals or verticals
    // verticals:
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    }
    //horizontals:
    if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }

    // visit the next cell (recursively call stepThroughCell again)
    stepThroughCell(nextRow, nextColumn);
  }
};

// Start the maze generation
stepThroughCell(startRow, startColumn);

// Drawing horizontal walls
horizontals.forEach((row, rowIndex) => {
  // open = true/false
  row.forEach((open, columnIndex) => {
    // don't draw a wall
    if (open) {
      return;
    }
    // draw a wall
    const wall = Bodies.rectangle(
      columnIndex * unitWidthX + unitWidthX / 2, // (x-axis)
      rowIndex * unitHeightY + unitHeightY, // (y-axis)
      unitWidthX, // rectangle width aka wall length
      2, // rectangle height aka wall thickness
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "red",
        },
      }
    );
    // add the wall to the world
    World.add(world, wall);
  });
});

// Drawing vertical walls
verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitWidthX + unitWidthX, // (x-axis)
      rowIndex * unitHeightY + unitHeightY / 2, // (y-axis)
      2,
      unitHeightY,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitWidthX / 2, // positions far right
  height - unitHeightY / 2, // positions far bottom
  unitWidthX * 0.5,
  unitHeightY * 0.5,
  {
    isStatic: true,
    label: "goal",
    render: {
      fillStyle: "green",
    },
  }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitWidthX, unitHeightY) / 4;
const ball = Bodies.circle(
  unitWidthX / 2, // positions far left
  unitHeightY / 2, // positions far top
  ballRadius,
  {
    isStatic: false,
    label: "ball",
    render: {
      fillStyle: "yellow",
    },
  }
);
World.add(world, ball);

// Controlling the ball
document.addEventListener("keydown", (e) => {
  // console.log(e);
  const maxVelocity = 5;
  const { x, y } = ball.velocity;
  if (e.code === "ArrowUp") {
    Body.setVelocity(ball, { x, y: Math.max(y - 5, -maxVelocity) });
  }
  if (e.code === "ArrowRight") {
    Body.setVelocity(ball, { x: Math.min(x + 5, +maxVelocity), y });
  }
  if (e.code === "ArrowDown") {
    Body.setVelocity(ball, { x, y: Math.min(y + 5, +maxVelocity) });
  }
  if (e.code === "ArrowLeft") {
    Body.setVelocity(ball, { x: Math.max(x - 5, -maxVelocity), y });
  }
});

// Collision
Events.on(engine, "collisionStart", (e) => {
  e.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];

    // win condition
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      // collapse the maze and display win message
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          // update the static flag on the body object to false
          Body.setStatic(body, false);
        }
      });
    }
  });
});

// Restart button
const restartButton = document.getElementById("restart-btn");
restartButton.addEventListener("click", () => {
  location.reload();
});
