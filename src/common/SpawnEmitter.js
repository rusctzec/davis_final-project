module.exports = {
	"alpha": {
		"start": 1,
		"end": 1
	},
	"scale": {
		"start": 0.5,
		"end": 0.01,
		"minimumScaleMultiplier": 3
	},
	"color": {
		"start": "#0000ff",
		"end": "#ffffff"
	},
	"speed": {
		"start": 80,
		"end": 60,
		"minimumSpeedMultiplier": 0.05
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0.1,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 200
	},
	"lifetime": {
		"min": 0.5,
		"max": 0.5
	},
	"blendMode": "normal",
	"ease": [
		{
			"s": 0,
			"cp": 0.329,
			"e": 0.548
		},
		{
			"s": 0.548,
			"cp": 0.767,
			"e": 0.876
		},
		{
			"s": 0.876,
			"cp": 0.985,
			"e": 1
		}
	],
	"frequency": 0.001,
	"emitterLifetime": 0.1,
	"maxParticles": 25,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": true,
	"spawnType": "point"
}