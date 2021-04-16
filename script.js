function inverse(obj){
  var retobj = {};
  for(var key in obj){
    retobj[obj[key]] = key;
  }
  return retobj;
}
  

const rawData = `
ID	Name	Native American	Asian	Black	Pacific Islander	Other	Unknown Race	White	Asian or Pacific Islander	Total by Race	Latino	Not Latino	Unknown Latino	Total by Latino
dukeu	Duke University Hospital	71	3105	7149	31	1487	656	21910	3136	34409	1511	32034	872	34417
dukereg	Duke Regional Hospital	29	604	3860	11	621	215	6520	615	11860	802	10827	230	11859
durham	Durham County Department of Public Health	152	500	4273	34	1009	439	6296	534	12703	1276	11031	393	12700
lincoln	Lincoln Community Health Center Inc	8	72	1577	3	341	40	380	75	2421	437	1890	94	2421
southpoint	Southpoint Pharmacy	0	61	446		26	19	897	61	1449	36	1393	20	1449
gurleys	Gurleys Pharmacy	4	29	280		73	710	236	29	1332	80	581	671	1332
ncspec	North Carolina Specialty Hospital	6	19	269		59	13	618	19	984	75	889	20	984
`

const categories = {
  black: "Black",
  hispanic: "Hispanic",
  white: "White",
  api: "Asian or Pacific Islander",
  na: "Native American",
}

const reversedCategories = inverse(categories)

const demographics = {
  black: 36.9,
  hispanic: 13.7,
  white: 43.0,
  na: 0.9,
  api: 5.6,
}

const casesDemographics = {
  black: 36.9,
  hispanic: 34,
  white: 28,
  api: 3,
  na: 0.0,
}

const deathDemographics = {
  black: 45,
  hispanic: 8,
  white: 81,
  api: 0,
  na: 0,
}


const vaxDemographics = {
  black: 27.94158539,
  hispanic: 7892/(95161 + 7892) * 100,
  white: 64.60004737,
  api: 0.127704714 + 6.892964912,
  na: 0.437697608,
}



function write(selector, text) {
  const els = document.querySelectorAll(selector)
  
  if (els.length === 0) {
    throw new Error(`No element found with selector ${selector}`)
  }
  
  for (const e of els) {
    e.textContent = text 
  }
}

function round(n) {
  return Math.round(n * 10) / 10
}

function parseData(data) {
  const split = data.split("\n").map(x => x.split("\t"))  
  const len = Math.max(...split.map(x => x.length))
  const table = split.filter(y => y.length == len)

  const header = table.shift()

  function objectify(keys, values) {
    return Object.assign(...keys.map((k, i) => ({ [k]: values[i].match(/^\d*$/) ?  parseInt(values[i]) || 0 : values[i] })));  
  }

  const entries = {}

  table.map(t => objectify(header, t)).forEach(o => {
    entries[o.ID] = o
  }) 
  return entries
}


Object.entries(categories).forEach((entry) => {
  const [cat, name] = entry
  write(`.js-pop-${cat}`, round(demographics[cat]) + '%')
  write(`.js-cases-${cat}`, round(casesDemographics[cat]) + '%')
  write(`.js-vax-${cat}`, round(vaxDemographics[cat]) + '%')
  write(`.js-vaxdiff-${cat}`, round((vaxDemographics[cat] - demographics[cat]) / demographics[cat] * 100) + '%')
  write(`.js-casesdiff-${cat}`, round((casesDemographics[cat] - demographics[cat]) / demographics[cat] * 100) + '%')
})




const entries = parseData(rawData)
const data = Object.values(entries)

//  document.getElementById('stuff').textContent = JSON.stringify(entries, null, 2)

const BORDER_COLORS = [
  "rgb(57,146,131)", "rgb(74,238,182)", "rgb(32,80,46)", "rgb(157,216,78)", "rgb(18,152,45)", "rgb(131,227,240)", "rgb(60,93,160)", "rgb(192,152,253)", "rgb(126,57,194)", "rgb(134,157,211)"]
const BACKGROUND_COLORS = ["rgb(57,146,131,0.2)", "rgb(74,238,182,0.2)", "rgb(32,80,46,0.2)", "rgb(157,216,78,0.2)", "rgb(18,152,45,0.2)", "rgb(131,227,240,0.2)", "rgb(60,93,160,0.2)", "rgb(192,152,253,0.2)", "rgb(126,57,194,0.2)", "rgb(134,157,211,0.2)"]
const SHRINK_FACTOR = 200

function transformDataToBubble(data, race, i) {
  console.log(race)
  let totalKey = 'Total by Race'
  if (race === 'Hispanic') {
    race = 'Latino'
    totalKey = 'Total by Latino'
  }
  
  const row = data[i]
  const total = row[totalKey]
  const names = data.map(x => x.Name.split(' ')[0])
  let title = row.Name.split(' ')[0]
  
  let count = 0
  for (let i = 0; i < names.length; i++) {
    if (names[i] == title) count++
  }
  
  if (count > 1) title = row.Name.split(' ')[0] + ' ' + row.Name.split(' ')[1]
  

  return {
    label: [row.Name],
    backgroundColor: BACKGROUND_COLORS[i],
    borderColor: BORDER_COLORS[i],
    title: title,
    data: [{
      x: i,
      y: row[race] / total * 100,
      r: total / SHRINK_FACTOR,
      total: total,
      actual: row[race],
      hypothetical: row[race]
    }]
  } 
}


window.charts = {}
  
function drawChart(category) {  
  const currCategory = categories[category]
  const currentPop = demographics[category]
  
  const ymax = currentPop < 2 ? 3 : currentPop < 10
                ? 15
                : currentPop < 50
                   ? 80
                   : 100
  
  const bubbleData = data.map((d, i) => transformDataToBubble(data, currCategory, i))
  const node = document.getElementById(`bubble-chart-${category}`)
  const chart = new Chart(node, {
    type: 'bubble',
    data: {
      datasets: bubbleData
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      dragData: true,
      dragX: false,
      dragDataRound: 0, // round to full integers (0 decimals)
      dragOptions: {
        // magnet: { // enable to stop dragging after a certain value
        //   to: Math.round
        // },
        showTooltip: true // Recommended. This will show the tooltip while the user 
        // drags the datapoint
      },
      onDragStart: function (e, element) {
        // where e = event
      },
      onDrag: function (e, datasetIndex, index, value) {
        // change cursor style to grabbing during drag action
        e.target.style.cursor = 'grabbing'

        const h = chart.data.datasets[datasetIndex].data[0].total * (value.y / 100)
        chart.data.datasets[datasetIndex].data[0].hypothetical = h
        const hypotheticalTotal = chart.data.datasets.map(x => x.data[0].hypothetical).reduce((x, y) => x + y, 0)
        const totalTotal = chart.data.datasets.map(x => x.data[0].total).reduce((x, y) => x + y, 0)

        const percent = hypotheticalTotal / totalTotal * 100
        chart.options.annotation.annotations[1].value = percent
        chart.update()
      },
      onDragEnd: function (e, datasetIndex, index, value) {
        // restore default cursor style upon drag release
        e.target.style.cursor = 'default'
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: `% of Those Vaccinated who are ${currCategory} (at least 1 dose)`,
          },
          ticks: {
            min: 0,
            max: ymax 
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: false,
          },
          ticks: {
            min: -1,
            max: data.length,
            display: false
          }
        }]
      },
      tooltips: {
        mode: 'point',
        callbacks: {
          label: (x) => {
            const data = chart.data.datasets[x.datasetIndex].data[0];
            return chart.data.datasets[x.datasetIndex].title + ' ' + Math.round(data.y, 1) + '%' + ` of ${data.total} Individuals`
          }  
        }

      },
      annotation: {
        annotations: [{
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: demographics[reversedCategories[currCategory]],
          borderColor: 'rgb(0, 0, 0)',
          borderWidth: 2,
          label: {
            enabled: true,
            content:  `% Population ${currCategory} (${demographics[reversedCategories[currCategory]]}%)`
          }
        },
        {
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: (() => {
            
            return 100 * data.map(x => x[currCategory === "Hispanic" ? "Latino" : currCategory]).reduce((x, y) => x + y, 0) / data.map(x => x['Total by Race']).reduce((x, y) => x + y, 0)
          })(),
          borderColor: 'rgb(0, 0, 0)',
          borderWidth: 1,
          borderStyle: 'dashed',
          label: {
            enabled: true,
            content: 'Hypothetical % Distribution to  ' + currCategory + ' Community'
          } 
        },


        {
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: (() => {
            return 100 * data.map(x => x[currCategory === "Hispanic" ? "Latino" : currCategory]).reduce((x, y) => x + y, 0) / data.map(x => x['Total by Race']).reduce((x, y) => x + y, 0)
          })(),
          borderColor: 'rgb(0, 200, 0)',
          borderWidth: 2,
          label: {
            enabled: true,
            content: '% Vaccine Distribution to ' + currCategory + ' Community '+ ' ('+ round(
            (() => {
            return 100 * data.map(x => x[currCategory === "Hispanic" ? "Latino" : currCategory]).reduce((x, y) => x + y, 0) / data.map(x => x['Total by Race']).reduce((x, y) => x + y, 0)
          })()
            )  + '%)'
          }
        }
        ]
      }
    }
  });
  
  window.charts[category] = chart
}


Object.keys(categories).forEach(k => drawChart(k))

function showChart(category) {
  write('.js-community-pop', demographics[category])
  write('.js-community-name', categories[category])
  const node = document.getElementById(`bubble-chart-${category}`)
  const charts = document.querySelectorAll('canvas')
  
  for (const chart of charts) {
    chart.parentElement.style.display = 'none'
    chart.style.display = 'none'
  }
  node.parentElement.style.display = 'block'
  node.style.display = 'block'
  Object.values(window.charts).forEach(c => c.resize())
}


showChart('black')

document.getElementById('community-select').onchange = (e) => {
  showChart(e.target.value)
}

function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}
