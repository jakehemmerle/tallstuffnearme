const fs = require('fs')

fs.readFile('./faa-data/39-OH.Dat', 'utf8' , (err: Error, data: string | string[]) => {
  if (err) {
    console.error(err)
    return
  }
  console.log(data)
})