import { transform } from "../loader";

import fs from 'fs';
import path from 'path';

const file = path.join(path.resolve(__dirname), "./web/index.vue");
const source = fs.readFileSync(file).toString();
const options = { auto: "views" };
const add = () => { };
console.log(transform(file, source, options, add));
