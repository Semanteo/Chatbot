const pseud = []
var weather = require('weather-js');
var geoip = require('geoip-lite');
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv6' && !net.internal && net.netmask === 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' && net.address != '::1') {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`Bonjour ! Quel est votre pseudo ?`)
function pseudo() {
    rl.question('Pseudo : \n', (answer) => {
        pseud.push(answer)
        data[5].answers.push(`Ton nom est ${pseud[0]}`)
        console.log(`Votre pseudo est ${pseud[0]}`);
        ask()
    });
}
pseudo()

function ask() {
    rl.question('Message : ', (answer) => {
        console.log(processString(answer));
        ask()
    });
}
ask()

const data = [
    {
        name: 'whatisweather',
        answertype: 'normal',
        words: ['temps', 'quel', 'fait', 'fait-il', 'il'],
        important: ['temps'],
        answers: [],
        after: [],
        getinfoafter: [' à ', ' a ', ' de ', ' dans '],
        function: weather,
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: 'whatisweather',
        answertype: 'normal',
        words: ['temps', 'quel', 'fait', 'fait-il', 'il'],
        important: ['temps'],
        answers: [],
        after: [],
        getinfoafter: [],
        function: getWeather,
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: "bonjour",
        answertype: 'normal',
        words: ['salut', 'wsh', 'yo', 'bonjour', 'wesh', 'cc', 'coucou'],
        important: [],
        answers: ['Bonjour', 'Salut', 'Yo'],
        after: [],
        getinfoafter: [],
        minimalmatch: 1,
        minimalpercent: 0
    },
    {
        name: 'humeur',
        answertype: 'normal',
        words: ['est', 'quelle', 'comment', 'ça', 'sa', 'ca', 'va', 'tu', 'vas', 'humeur', 'ton'],
        important: ['comment'],
        answers: ['Je vais bien', 'Ca va bien'],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: 'insultes',
        answertype: 'normal',
        words: ['connard', 'enculé', 'fdp', 'ntm', 'pute', 'con', 'tg'],
        important: [],
        answers: ['Ne m\'insute pas'],
        after: [],
        getinfoafter: [],
        minimalmatch: 1,
        minimalpercent: 0
    },
    {
        name: 'help',
        answertype: 'question',
        words: ['ai', 'aide', 'besoin', 'veux', 'je', 'aide', 'peux', 'aide', 'cherche', "j'ai", "l'aide"],
        important: [],
        answers: ['En quoi puis-je vous aider'],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: 'whatismyname',
        answertype: 'normal',
        words: ['est', 'quoi', 'quel', 'quelle', 'est', 'mon', 'ma', 'prénom', 'comment', 'je', 'appelle'],
        important: ['nom', 'prenom', 'appelle'],
        answers: [],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: 'whatismyip',
        answertype: 'normal',
        words: ['est', 'quoi', 'quel', 'quelle', 'est', 'mon', 'ma', 'ip'],
        important: ['ip'],
        answers: [`Ton ip est ${results.Ethernet}`],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 0
    },
    {
        name: 'whatisthetimelocal',
        answertype: 'normal',
        words: ['est', 'quelle', 'heure', 'est-il', 'il'],
        important: ['heure'],
        answers: [`Il est ${getHour()}`, "Actuellement il est " + getHour()],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 80
    }
]

function getHour() {
    return new Date().getHours() + "h" + new Date().getMinutes()
}

function getWeather() {
    const ip = results.Ethernet[0];
    const geo = geoip.lookup(ip);
    return new Promise((resolve, reject) => {
      weather.find({ search: geo.city, degreeType: 'C' }, function(err, res) {
        if (err) return reject(err);
        return resolve(`Météo pour : ${res[0].location.name} le ${res[0].current.date} \nHeure d'observation : ${res[0].current.observatuintime}`); 
      });   
    });
  }

  function getWeath(ville) {
    return new Promise((resolve, reject) => {
      weather.find({ search: ville, degreeType: 'C' }, function(err, res) {
        if (err) return reject(err);
        return resolve(`Météo pour : ${res[0].location.name} le ${res[0].current.date} \nHeure d'observation : ${res[0].current.observatuintime}`); 
      });   
    });
  }
  const res = getWeather().then(x => data[1].answers.push(`${x}`))
  res;
  async function weather(ville){
    const ret = await getWeath(ville)
    console.log(ret)
  };

  function weather(ville) {
    return 'beau'
}

function getHour() {
    return new Date().getHours() + "h" + new Date().getMinutes()
}

function processString(message) {
    let builtSentence = []
    let outSentence = ''

    for (const phrase of message.split(/[.?!]/)) {
        const words = removeShit(phrase.toLowerCase().replace(/,/g, '').replace(/é/g, 'e')).split(' ')

        for (const req of data) {
            const match = numberOfWordMatch(words, req.words)
            if (message.length <= 3 && req.minimalmatch >= 3) req.minimalmatch--
            if (match < req.minimalmatch || (match < req.minimalmatch && req.minimalpercent > 0 && (message.split(' ').length/100*match) < req.minimalpercent) || (req.important.length > 0 && numberOfWordMatch(words, req.important) < 1)) continue

            builtSentence.push(req)
        }
    }

    if (builtSentence.length > 0) {
        let i = 0
        let add = ''
        for (const data of builtSentence) {
            i++

            const up = ['?', '.', '!'].includes(outSentence.slice(-2).replace(/ /g, '')) || (outSentence.length < 2)

            if (builtSentence.length === i)
                add = data.answertype === 'normal' ? ran(['.', ' !']) : ' ?'
            else
                if ([3, 6, 9, 12, 15, 18].includes(i))
                    add = data.answertype === 'normal' ? '. ' : ' ? '
                else
                    add = data.after.length > 0 ? ran(data.after) + ' ' : (up && ((builtSentence.length - i + 1) >= 3)) || add.includes('et') ? ', ' : ' et '

            let rndm = ran(data.answers)

            const resultsData = stringContainsList(message, data.getinfoafter)

            if (data.getinfoafter.length > 0 && resultsData.length > 0) {
                for (const result of resultsData) {
                    const parsedData = message.split(result)[1].split(" ")[0]
                    const answer = data.function(parsedData)
                    rndm = ran(data.answers).format(answer, parsedData)
                }
            }

            outSentence += (up ? rndm.charAt(0).toUpperCase() + rndm.slice(1) : rndm) + add
        }

    } else outSentence = "Je n'ai pas compris"

    return outSentence
}

String.prototype.format = function () {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

function stringContainsList(s, l) {
    let results = []
    for (const a of l)
        if (s.includes(a))
            results.push(a)
    return results
}

function ran(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function numberOfWordMatch(words, dataword) {
    let numberMatch = 0
    for (const word of words)
        if (dataword.includes(word))
            numberMatch++
    return numberMatch
}

function removeShit(s) {
    let b = ''
    s.split('\'').forEach(e => b += e.slice(0, -1))
    b += s.slice(-1)
    return b
}