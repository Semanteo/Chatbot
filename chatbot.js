const pseud = []
const readline = require('readline')
const weather = require('weather-js')
var geoip = require('geoip-lite');
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = Object.create(null);
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv6' && !net.internal && net.netmask === 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' && net.address != '::1') {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}
const data = [
    {
        name: 'temps',
        answertype: 'normal',
        words: ['quelle', 'quel', 'temps', 'fait', 'il', 'fait-il', 'a', 'à'],
        important: ['temps'],
        answers: ['il fait {0}°C à {1} aujourd\'hui à {2}'],
        after: [],
        getinfoafter: [' à ', ' a ', ' de ', ' dans '],
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
        words: ['est', 'quelle', 'comment', 'ça', 'ca', 'va', 'tu', 'vas', 'humeur', 'ton', 'vas-tu'],
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
        words: ['ai', 'aide', 'besoin', 'veux', 'je', 'aide', 'peux', 'aide', 'cherche', "j'ai", "l'aide", "d'aide"],
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
        words: ['est', 'quoi', 'quel', 'quelle', 'est', 'mon', 'ma', 'prénom', 'comment', 'je', 'appelle', "m'appelle"],
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
    },
    {
        name: 'dev',
        answertype: 'normal',
        words: ['en','qui', 'quel', 'comment', 'quelle', "t'as", 'langage', 'language', 'code', 'programmation', 'fait', 'été', 'codé', 'dev'],
        important: [],
        answers: ["J'ai été développé en javscript par Semanteo avec l'aide de Shawiiz_z"],
        after: [],
        getinfoafter: [],
        minimalmatch: 3,
        minimalpercent: 0
    }
]

  function getWeather(ville) {
    if (ville === null) {
        const ip = results.Ethernet[0];
        const geo = geoip.lookup(ip);
        return new Promise(async (resolve) => {
            weather.find({ search: geo.city, degreeType: 'C' }, function(err, res) {
                if (err) resolve(['inconnu', 'inconnu', 'inconnu'])
                try {
                    resolve([res[0].current.temperature, res[0].location.name, res[0].current.observationtime])
                } catch (e) {
                    resolve(['inconnu', 'inconnu', 'inconnu'])
                }
            })
        });
    } else
        return new Promise(async (resolve) => {
            weather.find({ search: ville, degreeType: 'C' }, (err, res) => {
                if (err) resolve(['inconnu', 'inconnu', 'inconnu'])
                try {
                    resolve([res[0].current.temperature, res[0].location.name, res[0].current.observationtime])
                } catch (e) {
                    resolve(['inconnu', 'inconnu', 'inconnu'])
                }
            })
        });
}

function getHour() {
    return new Date().getHours() + "h" + new Date().getMinutes()
}

async function processString(message) {
    let builtSentence = []
    let outSentence = ''

    for (const phrase of message.split(/[.?!]/)) {
        const words = removeShit(phrase.toLowerCase().replace(/,/g, '').replace(/é/g, 'e')).split(' ')

        for (const req of data) {
            const match = numberOfWordMatch(words, req.words)
            if (message.length <= 3 && req.minimalmatch >= 3) req.minimalmatch--
            if (match < req.minimalmatch || (match < req.minimalmatch && req.minimalpercent > 0 && (message.split(' ').length / 100 * match) < req.minimalpercent) || (req.important.length > 0 && numberOfWordMatch(words, req.important) < 1)) continue

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

            if (data.getinfoafter.length > 0) {
                let parsedData = null
                if (resultsData.length > 0)
                    for (const result of resultsData)
                        parsedData = message.split(result)[1].split(" ")[0]
                const answer = await data.function(parsedData)
                rndm = ran(data.answers).format(...answer)
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
    words = words.filter(function (item, pos) {
        return words.indexOf(item) == pos;
    })
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
    rl.question('Message : ', async (answer) => {
        console.log((await processString(answer)));
        ask()
    });
}
ask()