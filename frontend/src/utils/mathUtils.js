export function randomNormal(mean = 0, std = 1) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * std + mean;
}

export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 100) return arr[arr.length - 1];

  const index = (arr.length - 1) * p / 100.0;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= arr.length) return arr[lower];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}
