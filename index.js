const { Engine, Render, Runner, World, Bodies } = Matter;

// Variables
const width = 600;
const height = 600;
const cells = 3;
const unitWidth = width / cells;
const unitHeight = height / cells;

const engine = Engine.create();
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: true,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  // top
  Bodies.rectangle(width / 2, 0, width, 40, {
    isStatic: true,
  }),
  // bottom
  Bodies.rectangle(width / 2, height, width, 40, {
    isStatic: true,
  }),
  // left
  Bodies.rectangle(0, height / 2, 40, height, {
    isStatic: true,
  }),
  // right
  Bodies.rectangle(width, height / 2, 40, height, {
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
const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

// Verticals
const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

// Horizontals
const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

// Starting point
const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

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
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
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
      columnIndex * unitWidth + unitWidth / 2, // (x-axis)
      rowIndex * unitHeight + unitHeight, // (y-axis)
      unitWidth, // rectangle width aka wall length
      2, // rectangle height aka wall thickness
      {
        isStatic: true,
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
      columnIndex * unitWidth + unitWidth, // (x-axis)
      rowIndex * unitHeight + unitHeight / 2, // (y-axis)
      2,
      unitHeight,
      {
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});
