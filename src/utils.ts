export const arrayEqual = <T>(arr1: T[], arr2: T[]) => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr2.includes(arr1[i]) === false) {
      return false;
    }
  }

  return true;
};
