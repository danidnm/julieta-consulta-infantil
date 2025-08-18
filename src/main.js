import { startAlpine } from './app/setup';
import { startRouter } from './app/router';

document.addEventListener('DOMContentLoaded', () => {
    startAlpine();  // directives + components + Alpine.start()
    startRouter();  // hash listener + initial render
});
