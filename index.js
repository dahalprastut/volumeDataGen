const fs = require("fs");

// Read the JSON file
const jsonData = fs.readFileSync("field_lines4.json", "utf-8");

// Parse the JSON data
const threeDimArr = JSON.parse(jsonData);
const highestValue = 511;
const middleValue = 400;
const lowestValue = 300;

const num_field = threeDimArr[4];

const height = 512;
const width = 512;
const depth = 512;

const curveWidth = 10;

const filteredNums = num_field.filter((num) => num !== 0);

// Find the highest, lowest (excluding 0), and middle values
// This is done to set a limit to what might be the highest, lowest and middle values
// const highest = Math.max(...filteredNums);
// const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 28];
const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 5];

// const lowest = Math.min(...filteredNums);
const lowest = filteredNums.sort((a, b) => a - b)[10];
// const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length / 2) - 10];
const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length) - 20];

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

let currentMax = Infinity;
let objForNeighbours;
let scaledThicknessArr = [];
const findingGaussianArray = (max) => {
	scaledThicknessArr = [];
	const start = -2;
	const end = 2;
	const mean = 0;
	const totalNumberOfPoints = max;
	const thicknessArr = [];
	const standardDeviation = 0.5;

	let xval = start;

	const step = (end - start) / totalNumberOfPoints;

	for (let i = 0; i <= totalNumberOfPoints; i++) {
		// const coefficient = 1 / (standardDeviation * Math.sqrt(2 * Math.PI));
		// const exponent = -((xval - mean) ** 2) / (2 * standardDeviation ** 2);
		const thicknessValue =
			(1 / (standardDeviation * Math.sqrt(2 * Math.PI))) *
			Math.exp(-((xval - mean) ** 2) / (2 * standardDeviation ** 2));
		thicknessArr.push(thicknessValue);
		xval += step;
	}

	const maxThickness = Math.max(...thicknessArr);
	// Scale the thickness values based on the maximum thickness
	const scalingFactor = curveWidth / maxThickness;

	scaledThicknessArr = thicknessArr.map((value) => Math.ceil(value * scalingFactor));
	return scaledThicknessArr;
};

const resultArray = findingGaussianArray(num_field[0]);

// Convert the array to a comma-separated string
const resultString = resultArray.join("\n");

fs.writeFileSync("output.txt", resultString);

// Function to set the value for a given voxel and its neighbors
const setVoxelAndNeighbors = (x, y, z, value, count, max) => {
	let half;

	// console.log("count", count, scaledThicknessArr);
	const result = scaledThicknessArr[count];

	// if (result !== 1) {
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
};

findingGaussianArray(num_field[j]);

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
		findingGaussianArray(num_field[j]);
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

// function flatten(arr) {
// 	return arr.reduce((prev, curr) => {
// 		return prev.concat(Array.isArray(curr) ? flatten(curr) : curr);
// 	}, []);
// }

// Flatten the 3D array into a 1D array
// const flattenedData = flatten(volumetricDataset);
// const flattenedData = volumetricDataset.flat(2);
// console.log("fla", flattenedData.length);

// // Convert array of values to Uint8Array
// const uint8Array = new Uint8Array(flattenedData);

// // Write the Uint8Array to a file
// fs.writeFileSync("volume.byte", Buffer.from(uint8Array));

// console.log('File "volume.byte" created successfully.');

// ================

// ==============================

// Function to flatten and write data to file
const flattenAndWriteToFile = (data, filename, append = false) => {
	const flattenedData = data.flat(2);
	console.log("adsf", flattenedData.length);
	const uint8Array = new Uint8Array(flattenedData);
	const flag = append ? "a" : "w";
	fs.writeFileSync(filename, Buffer.from(uint8Array), { flag }); // 'a' flag appends to the file
	console.log(`Data ${append ? "appended" : "created"} to file "${filename}" successfully.`);
};

// Assuming half of the volumetricDataset
const firstHalf = volumetricDataset.slice(0, Math.ceil(volumetricDataset.length / 2));
// Flatten and write the first half
flattenAndWriteToFile(firstHalf, "volume.byte");

// Assuming the remaining volumetricDataset
const secondHalf = volumetricDataset.slice(Math.ceil(volumetricDataset.length / 2));

// Flatten and append the second half
flattenAndWriteToFile(secondHalf, "volume.byte", true);
