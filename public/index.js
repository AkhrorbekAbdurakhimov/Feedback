const fs = require('fs')
const path = require('path')

fs.readFile(path.join(__dirname, 'file.txt'), "utf-8", (err, data) => {
    if (err) throw err
    const lines = data.split(/\r?\n/)
    let array = []
    lines.forEach((line) => {
        let wordsEachLine = line.split(' ').length 
        if (!line.includes(',') && wordsEachLine > 3) {
           array.push(line.split(' ')[1])
        }
    })
    array = ascendingSorting(array)
    let length = array.length
    for (let i = 0; i < length; i++) {
        console.log(array[i])
    }
    fs.appendFile(path.join(__dirname, 'file.txt'), `\n${length}`, function (err) {
        if (err) throw err
        console.log('Saved!')
    });
})

function ascendingSorting (array) {
    for (let i = 0; i < array.length - 1; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i].toLowerCase() > array[j].toLowerCase()) {
                let temp = array[i]
                array[i] = array[j]
                array[j] = temp
            }
        }
    }
    return array
}