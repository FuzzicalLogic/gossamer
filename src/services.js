module.exports = (function() {
	return [{
		name: 'filesystem',
		access: 'local',
		port: 3000
	}, {
		name: 'components',
		access: 'remote',
		port: 3001
	}];

}) ();
