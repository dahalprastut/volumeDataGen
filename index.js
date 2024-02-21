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
let dataUsed = 0;

// for counting
const obj = {
	highest: 0,
	middle: 0,
	lowest: 0,
};

let currentMax = Infinity;
let objForNeighbours;

// Function to calculate Gaussian function
function gaussianFunction(x, y, z, meanX, meanY, meanZ, standardDeviation) {
	const exponent = -(
		(x - meanX) ** 2 / (2 * standardDeviation ** 2) +
		(y - meanY) ** 2 / (2 * standardDeviation ** 2) +
		(z - meanZ) ** 2 / (2 * standardDeviation ** 2)
	);
	return Math.exp(exponent);
}

// Function to set the value for a given voxel and its neighbors
const setVoxelAndNeighbors = (x, y, z, value, count, max) => {
	let half;
	// I think the logic behind this is wrong
	// I am getting all the points from outside (x,y and z)
	// I need to calculate the mean first suppose x = 2100, I need to find the total length of this curve and if the total lengh is 2000
	// I need to see the currentPos + 2000 and see the last x value and calculate the mean
	// and based on this mean I have to set the width for each point
	// But why do I have to look at x? why not y or z for that matter?
	// or can I just look at the total number of points the curve has and see the mean based on the count
	//  but that way, in the formula my i(or x) will always be from 0 to total_length of the curve
	// maybe I need to uderstand the formula first of how width can be defined from the formula.
	if (currentMax !== max) {
		objForNeighbours = {};

		// Calculate the mean (halfway point)

		// Calculate standard deviation factor
		const standardDeviation = 1; // Adjust as needed

		// object for setting Neighbors
		half = Math.floor(max / 2);
		const meanX = threeDimArr[0][dataUsed + half];
		const meanY = threeDimArr[2][dataUsed + half];
		const meanZ = threeDimArr[1][dataUsed + half];
		// Why am i doing this for every point? why am i applying loop for every point as points are selectedd from outside
		for (let i = 0; i < max; i++) {
			// Calculate Gaussian function for each position
			const valueAtX = threeDimArr[0][i];
			const valueAtY = threeDimArr[2][i];
			const valueAtZ = threeDimArr[1][i];
			// Calculate distance from the center of the curve
			// const distance = Math.sqrt((valueAtX - meanX) ** 2 + (valueAtY - meanY) ** 2 + (valueAtZ - meanZ) ** 2);
			// console.log("di", distance)
			const gaussianValue = gaussianFunction(
				valueAtX,
				valueAtY,
				valueAtZ,
				meanX,
				meanY,
				meanZ,
				standardDeviation
			);
			// console.log("ga", gaussianValue);
			// // f(x)=e ^ -((x - mean)^2/2.sd^2)
			// const gaussianValue = Math.exp(-(Math.pow(i - half, 2) / (2 * Math.pow(standardDeviation * half, 2))));

			// Determine width based on the Gaussian value
			const widthFactor = Math.floor(gaussianValue * curveWidth);

			// Store in the object
			objForNeighbours[i] = widthFactor;
		}
		dataUsed = dataUsed + max;
		currentMax = max;
	}
	// console.log("obj", objForNeighbours);

	const result = Object.entries(objForNeighbours).filter(([key, val]) => key == count)[0][1];

	for (let i = -result; i <= result; i++) {
		for (let j = -result; j <= result; j++) {
			for (let k = -result; k <= result; k++) {
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

	// if (result !== 1) {
	// 	for (let i = -Math.trunc(result / 2); i <= Math.trunc(result / 2); i++) {
	// 		for (let j = -Math.trunc(result / 2); j <= Math.trunc(result / 2); j++) {
	// 			for (let k = -Math.trunc(result / 2); k <= Math.trunc(result / 2); k++) {
	// 				const newX = x + i;
	// 				const newY = y + j;
	// 				const newZ = z + k;

	// 				// Check if the new coordinates are within the dimensions of volumetricDataset
	// 				if (newX >= 0 && newX < width && newY >= 0 && newY < height && newZ >= 0 && newZ < depth) {
	// 					volumetricDataset[newX][newY][newZ] = value;
	// 				}
	// 			}
	// 		}
	// 	}
	// } else {
	// 	if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth) {
	// 		volumetricDataset[x][y][z] = value;
	// 	}
	// }
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
			setVoxelAndNeighbors(x, y, z, valueToSet, count, initial_max);
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
