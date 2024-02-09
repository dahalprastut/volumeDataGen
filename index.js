const fs = require("fs");

// Read the JSON file
const jsonData = fs.readFileSync("field_lines_new.json", "utf-8");

// Parse the JSON data
const threeDimArr = JSON.parse(jsonData);
const highestValue = 255;
const middleValue = 180;
const lowestValue = 90;

const num_field = threeDimArr[4];

const height = 256;
const width = 256;
const depth = 256;

const curveWidth = 5;

const filteredNums = num_field.filter((num) => num !== 0);

// Find the highest, lowest (excluding 0), and middle values
// This is done to set a limit to what might be the highest, lowest and middle values
// const highest = Math.max(...filteredNums);
const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 28];
// const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 1];

// const lowest = Math.min(...filteredNums);
const lowest = filteredNums.sort((a, b) => a - b)[10];
const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length / 2) - 10];
// const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length) - 2];

const volumetricDataset = new Array(width)
	.fill(0)
	.map(() => new Array(height).fill(0).map(() => new Array(depth).fill(0)));

let count = 0;
let j = 0;
let initial_max = num_field[j];

// for counting
const obj = {
	highest: 0,
	middle: 0,
	lowest: 0,
};

// Function to set the value for a given voxel and its neighbors
const setVoxelAndNeighbors = (x, y, z, value) => {
	for (let i = -Math.trunc(curveWidth / 2); i <= Math.trunc(curveWidth / 2); i++) {
		for (let j = -Math.trunc(curveWidth / 2); j <= Math.trunc(curveWidth / 2); j++) {
			for (let k = -Math.trunc(curveWidth / 2); k <= Math.trunc(curveWidth / 2); k++) {
				const newX = x + i;
				const newY = y + j;
				const newZ = z + k;

				// Check if the new coordinates are within the dimensions of volumetricDataset
				if (newX >= 0 && newX < width && newY >= 0 && newY < height && newZ >= 0 && newZ < depth) {
					volumetricDataset[newX][newY][newZ] = value;
				}
			}
		}
	}
};

for (let i = 0; i < threeDimArr[0].length; i++) {
	const x = Math.round(threeDimArr[0][i]);
	const y = Math.round(threeDimArr[2][i]);
	const z = Math.round(threeDimArr[1][i]);

	// Calculate the absolute differences to know where the curve falls closer which can be used to set the voxel value
	let diffToHighest = Math.abs(initial_max - highest);
	let diffToMidd = Math.abs(initial_max - middle);
	let diffToLowest = Math.abs(initial_max - lowest);

	if (count === initial_max) {
		// console.log("diff", initial_max, highest, middle, lowest);
		if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
			obj.highest = obj.highest + 1;
		} else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
			obj.middle = obj.middle + 1;
		} else {
			obj.lowest = obj.lowest + 1;
		}
		j = j + 1;
		initial_max = num_field[j];
		count = 0;
	}

	if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
		// Value is closer to highest
		valueToSet = highestValue;
	} else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
		// Value is closer to middle
		valueToSet = middleValue;
	} else {
		// Value is closer to lowest
		valueToSet = lowestValue;
	}
	// Check if the coordinates are within the dimensions of volumetricDataset
	if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth) {
		if (valueToSet === highestValue) {
			// To have the highest value of bigger width
			// This might be changed if every values must have the same width
			setVoxelAndNeighbors(x, y, z, valueToSet);
		} else {
			volumetricDataset[x][y][z] = valueToSet;
		}
	}
	count = count + 1;
}
console.log("onj", obj);

// Flatten the 3D array into a 1D array
const flattenedData = volumetricDataset.flat(2);

// Convert array of values to Uint8Array
const uint8Array = new Uint8Array(flattenedData);

// Write the Uint8Array to a file
fs.writeFileSync("volume.byte", Buffer.from(uint8Array));

console.log('File "volume.byte" created successfully.');

// ================

// ==============================
