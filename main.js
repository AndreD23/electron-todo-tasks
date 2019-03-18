//handle setupevents as quickly as possible
//  const setupEvents = require('./setupEvents')
//  if (setupEvents.handleSquirrelEvent()) {
//     // squirrel event handled and app will exit in 1000ms, so don't do anything else
//     return;
//  }

//-------------------------------------------------------------------
// Constantes do ambiente
//-------------------------------------------------------------------
const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;
const { autoUpdater } = require("electron-updater")
const log = require('electron-log');

//-------------------------------------------------------------------
// LOGGING
//
// Esta configuração de setup não é obrigatória para fazer o autoUpdate
// rodar, mas com certeza deixa o debug mais fácil :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Iniciando o App...');


//-------------------------------------------------------------------
// Variável de ambiente
//-------------------------------------------------------------------
process.env.NODE_ENV = 'local';


//-------------------------------------------------------------------
// CONFIGURAÇÕES DO SERVIDOR
//
// Esta sessão configura a url e todos os parâmetros que serão
// utilizados pelo autoUpdate
//-------------------------------------------------------------------
const server = (process.env.NODE_ENV == 'local' ? 'http://10.0.3.18:1337' : null);

const feedPlatform = (process.platform === 'linux' ? 'linux' : (process.platform === 'darwin' ? 'darwin' : 'win'));
const feedArch = (process.arch === 'x64' ? '64' : '32');
const feed = `${server}/update/${feedPlatform + feedArch}/${app.getVersion()}`;


//-------------------------------------------------------------------
// VARIÁVEIS DE ESCOPO DE BLOCO
//
// A grande maioria das variáveis desta sessão serão janelas do sistema
//-------------------------------------------------------------------
let mainWindow;
let addWindow;
let addMenu = null;

//-------------------------------------------------------------------
// LISTENNER DE READY
//
// Instruções a serem executadas assim que o app estiver pronto
//-------------------------------------------------------------------
app.on('ready', function () {

    let version = app.getVersion();
    let windowtitle = 'Electron ToDo Tasks App - Versão: ' + version;

    // Cria nova janela
    mainWindow = new BrowserWindow({
        title: windowtitle,
    });

    //carrega o arquivo html dentro da janela principal
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Finaliza o app quando fechar a janela
    mainWindow.on('closed', function () {
        app.quit();
    })

    //Constrói o menu pelo template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    //Insere menu
    Menu.setApplicationMenu(mainMenu);

    //Verifica por updates
    autoUpdater.setFeedURL(feed);
    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 60000);
});

//-------------------------------------------------------------------
// JANELA DE ADIÇÃO DE ITEM
//
// Esta função cria e executa a nova janela de adição de item
//-------------------------------------------------------------------
function createAddWindow() {
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Adiciona Item de compra'
    });

    //carrega o arquivo html dentro da nova janela
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Remove a barra de menu
    if (process.platform !== 'darwin') {
        addWindow.setMenu(addMenu);
    }

    //Lida com garbage collection
    addWindow.on('close', function () {
        addWindow = null;
    });
}

//-------------------------------------------------------------------
// COMUNICAÇÃO COM ADICIONAR ITEM - IPCMAIN
//
// Este listenner aguarda o evento de submit de adição de item
//-------------------------------------------------------------------
ipcMain.on('item:add', function (e, item) {
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
});


//-------------------------------------------------------------------
// CONFIGURAÇÕES DO TEMPLATE MENU
//
// Os próximos trechos desta sessão configuram a aparencia, botões
// e funcionalidades do menu das janelas
//-------------------------------------------------------------------
const mainMenuTemplate = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Adicionar item',
                accelerator: process.platform == 'CommandOrControl+D',
                click() {
                    createAddWindow();
                }
            },
            {
                label: 'Limpar itens',
                accelerator: 'CommandOrControl+L',
                click() {
                    mainWindow.webContents.send('item:clear');
                }
            },
            {
                label: 'Sair',
                accelerator: 'CommandOrControl+Q',
                click() {
                    app.quit();
                }
            },


        ]
    }
];

// Se o sistema operacional for um mac, adicionar um item vazio no menu.
// Isto tem que ser feito para não apresentar o icone do Electron como primeira opção do mac
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

// Adiciona item Developer Tools caso não esteja em produção
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Abrir/Fechar DevTools',
                accelerator: 'CommandOrControl+I',
                click(item, focuseWindow) {
                    focuseWindow.toggleDevTools();
                }
            },
            {
                label: 'Recarregar',
                role: 'reload'
            }
        ]
    });
}

// autoUpdater.on('update-available', () => {
//     console.log('Há atualização disponível!');
// });

// autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
//     const dialogOpts = {
//         type: 'info',
//         buttons: ['Mais tarde', 'Reiniciar'],
//         title: 'Atualização do Electron Shopping',
//         message: process.platform === 'win32' ? releaseNotes : releaseName,
//         detail: 'Uma nova versão do Electron Shopping foi recebida. Reinicie a aplicação para aplicar atualização'
//     }

//     dialog.showMessageBox(dialogOpts, (response) => {
//         if(response === 1) autoUpdater.quitAndInstall() //Comentário aleatório
//     })
// });

// autoUpdater.on('error', message => {
//     console.log('Error');
//     console.log(message);
// })


//-------------------------------------------------------------------
// CONFIGURAÇÕES DO AUTOUPDATE
//
// Busca por atualização do app
//-------------------------------------------------------------------
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

autoUpdater.on('checking-for-update', () => {
    log.info('Verificando por atualizações...');
});
autoUpdater.on('update-available', (ev, info) => {
    log.info('Atualização disponível.');
});
autoUpdater.on('update-not-available', (ev, info) => {
    log.info('Atualização não disponível.');
});
autoUpdater.on('error', (ev, err) => {
    log.info('Erro no auto-updater.');
});
autoUpdater.on('download-progress', (ev, progressObj) => {
    log.info('Download da atualização em progresso...');
});

autoUpdater.on('update-downloaded', () => {
    
    log.info('Atualização baixada.');

    dialog.showMessageBox({
        type: 'info',
        title: 'Atualizações disponíveis',
        message: 'Há novas atualizações para o app. Deseja atualizar agora?',
        buttons: ['Não', 'Sim']
    }, (buttonIndex) => {
        if (buttonIndex === 1) {
            const isSilent = true;
            const isForceRunAfter = true;
            autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
        }
        else {
            updater.enabled = true
            updater = null
        }
    })

})