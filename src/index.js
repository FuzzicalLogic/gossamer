"use strict";
const __LOG__ = console.log.bind(console);
const __LOG_AND_RETHROW__ = (error) => {
	__LOG__(error);
	throw error;
}

process.on('error', __LOG_AND_RETHROW__);
process.on('unhandledRejection', (reason, promise) => {
    __LOG__(promise);
    throw new Error(reason);
});

(async function bootstrap() {
	try {
		let cimport = await require('cimport');

		console.log('CImport loaded');
		console.log(cimport);

		let electron = await cimport.Promise.resolve(require('electron'));
		electron.app.cimport = cimport;
	}
	catch(ex) {
		catchImportException(ex);
	}

	return runApplication(electron);
}) ()

function runApplication(electron) {
	console.log('Starting Application');
// Bind main application to electron.app
	return require('./gossamer').call(electron.app, electron);
}

function catchImportException(error) {
	__LOG__(error);
}

