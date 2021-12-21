import { readFile } from 'fs';

export const parseOhioAsText = () => {
    readFile('./faa-data/39-OH.Dat', { encoding: 'utf8' }, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(data);
    })
}