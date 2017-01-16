const sentence = 'they mei';
const words = sentence.split(' ');
const lexicon = ['they'];

words.forEach(word => {
    if (lexicon.indexOf(word) === -1) console.log(word);    
});
