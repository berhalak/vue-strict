import { transform } from "../loader";

import fs from 'fs';
import path from 'path';

const file = path.join(path.resolve(__dirname), "./pages/sub/index.vue");
const source = fs.readFileSync(file).toString();
const options = { auto: "views", log: true, path: 'C:\\js\\dev' };
const add = () => { };
transform(file, source, options, add);
