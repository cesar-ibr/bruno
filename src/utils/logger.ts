export const logger = (service = 'SERVICE') => (message = '', color = 'white') => {
    console.log(`%c[${service}] ${message}`, `color: ${color}`)
};

export const logTime = (start: number, label = 'TIME') => {
    const seconds = (Date.now() - start) / 1000;
    console.log(`%c[${label}] ${seconds}s`, 'color: orchid');
};