export function filterArray(source: string[], removeArray: string[]) {
  let result: string[] = [], found;
  for (let item of source) {
    found = false;
    // find a[i] in b
    for (let removeItem of removeArray) {
      if (item == removeItem) {
        found = true;
        break;
      }
    }
    if (!found) {
      result.push(item);
    }
  }
  return result
}
