// Downloads the filed reports that some companies need (see sources.ts `supplement`).
import { SOURCES } from './sources';
import { loadSupplements } from './xbrl';
await loadSupplements(SOURCES);
console.log('supplements saved');
