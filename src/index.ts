#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { input } from '@inquirer/prompts';
import Conf from 'conf';
import { PalDefenderClient } from 'paldefender-rest-client';

// Initialize persistent config storage
const config = new Conf({ projectName: 'pd-cli' });

const program = new Command();

/**
 * Setup the API Client using Config Store or Env Variables
 */
function getClient() {
    return new PalDefenderClient({
        token: (config.get('token') as string) || process.env.PD_TOKEN!,
        host: (config.get('host') as string) || process.env.PD_HOST || '127.0.0.1',
        port: Number((config.get('port') as string) || process.env.PD_PORT || 17993)
    });
}

const client = getClient();

program
    .name('pd-cli')
    .description('PalDefender Management CLI')
    .version('1.0.0');

// --- Branding ---
const splashText = `
${chalk.cyan.bold('██████╗ ██████╗       ██████╗██╗     ██╗')}
${chalk.cyan.bold('██╔══██╗██╔══██╗     ██╔════╝██║     ██║')}
${chalk.cyan.bold('██████╔╝██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██╔═══╝ ██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██║     ██████╔╝     ╚██████╗███████╗██║')}
${chalk.cyan.bold('╚═╝     ╚═════╝       ╚═════╝╚══════╝╚═╝')}

      ${chalk.grey('Admin Utility by GlitchApotamus')}
`;

program.addHelpText('before', boxen(splashText, {
    padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan',
    title: 'PD-CLI v0.0.1', titleAlignment: 'center'
}));

// --- Persistence Command ---
program
    .command('configure')
    .description('Interactively save your server connection details')
    .action(async () => {
        console.log(chalk.cyan('\n⚙️  Global Configuration Setup\n'));
        
        const token = await input({ 
            message: 'Enter your PalDefender Admin Token:',
            default: (config.get('token') as string) || process.env.PD_TOKEN !
        });
        
        const host = await input({ 
            message: 'Enter Server Host/IP:', 
            default: (config.get('host') as string) || process.env.PD_HOST || '127.0.0.1' 
        });
        
        const port = await input({ 
            message: 'Enter Server Port:', 
            default: (config.get('port') as string) || process.env.PD_PORT || '8212' 
        });

        config.set('token', token);
        config.set('host', host);
        config.set('port', port);

        console.log(chalk.green('\n✔ Configuration saved successfully!'));
        console.log(chalk.grey(`Stored at: ${config.path}\n`));
    });

// --- Dynamic Library Commands ---
function getParamNames(func: Function): string[] {
    const fnStr = func.toString();
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    return result === null ? [] : result;
}

const methods = Object.getOwnPropertyNames(PalDefenderClient.prototype);

methods.forEach((methodName) => {
    if (methodName === 'constructor' || methodName.startsWith('_')) return;

    const method = (client as any)[methodName];

    if (typeof method === 'function') {
        const cmd = program.command(methodName);
        const params = getParamNames(method);

        params.forEach(param => {
            cmd.argument(`<${param}>`, `Parameter: ${param}`);
        });

        cmd.description(`Execute ${methodName} via API`)
            .action(async (...args) => {
                const rawArgs = args.slice(0, args.length - 1);

                if (rawArgs.length < method.length) {
                    console.error(chalk.yellow(`\n⚠️  Missing Arguments!`));
                    console.error(chalk.white(`   ${methodName} requires ${method.length} arguments.\n`));
                    console.log(cmd.helpInformation());
                    return;
                }

                const processedArgs = rawArgs.map(arg => {
                    if (typeof arg === 'string' && (arg.startsWith('[') || arg.startsWith('{'))) {
                        try { return JSON.parse(arg); } catch { return arg; }
                    }
                    return arg;
                });

                const spinner = ora({ text: chalk.blue(`Requesting ${methodName}...`), color: 'cyan' }).start();

                try {
                    const result = await method.apply(client, processedArgs);
                    spinner.succeed(chalk.green(`API Success: ${methodName}`));
                    
                    console.log(boxen(JSON.stringify(result, null, 2), {
                        padding: 0.5, borderColor: 'green', dimBorder: true
                    }));

                } catch (error: any) {
                    spinner.fail(chalk.red(`API Failure: ${methodName}`));
                    console.error(chalk.red.bold(`\n✖ Error:`), chalk.white(error.message));
                    
                    if (error.message.includes('401')) {
                        console.error(chalk.yellow('👉 Run "pd-cli configure" to update your credentials.'));
                    }
                }
            });
    }
});

program.parse();