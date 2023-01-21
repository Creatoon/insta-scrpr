import * as fs from 'fs';

/**
 * @function
 * @param {number} timestamp - The timestamp to be converted to reel time
 * @returns {string} - An ISO date string
 * @example
 * const iso = getReelTimeStamp(1673507303);
 * console.log(iso) // 12/01/2023
 */
export const getReelIstFromTimeStamp = (timestamp) => {
  const iso = new Date(timestamp * 1000);
  let options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  };

  return iso.toLocaleDateString('en-IN', options);
};

export const fileName = () => {
  let date = new Date();
  let year = date.getFullYear();
  let month = ('0' + (date.getMonth() + 1)).slice(-2);
  let day = ('0' + date.getDate()).slice(-2);
  let hour = ('0' + date.getHours()).slice(-2);
  let minute = ('0' + date.getMinutes()).slice(-2);
  let second = ('0' + date.getSeconds()).slice(-2);

  return `${day}-${month}-${year}_${hour}:${minute}:${second}`;
};

export const getRowsAsArrayElements = (path) => {
  return fs
    .readFileSync(path, 'utf8')
    .split('\n')
    .map((el) => el.trim());
};

export const averageGap = (timestamps) => {
  timestamps.reverse();

  const timeObjects = timestamps.map((t) => new Date(t * 1000));

  const differences = [];
  for (let i = 0; i < timeObjects.length - 1; i++) {
    differences.push(timeObjects[i + 1] - timeObjects[i]);
  }

  return Math.round(
    differences.reduce((a, b) => a + b, 0) /
      differences.length /
      (24 * 60 * 60 * 1000)
  );
};
