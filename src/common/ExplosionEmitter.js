module.exports = {
	"alpha": {
		"start": 1,
		"end": 1
	},
	"scale": {
		"start": 0.5,
		"end": 0.01,
		"minimumScaleMultiplier": 5
	},
	"color": {
		"start": "#ffffff",
		"end": "#100f0c"
	},
	"speed": {
		"start": 700,
		"end": 0,
		"minimumSpeedMultiplier": 0.001
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
	"maxParticles": 50,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": true,
	"spawnType": "point"
}