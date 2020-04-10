import { HelloModel } from '../models/hello.model';

const getName = (info: HelloModel) => {
  let name = info.firstName;

  if (info.lastName) {
    name += ` ${info.lastName}`;
  }

  return name;
};

export default getName;