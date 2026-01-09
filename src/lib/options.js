const options = {
  collapseModelArchitectureByDefault: false,
};

export function setPlaygroundOptions(nextOptions = {}) {
  Object.assign(options, nextOptions);
}

export function getPlaygroundOptions() {
  return options;
}

