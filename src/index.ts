#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { input } from '@inquirer/prompts';
import Conf from 'conf';
import { PalDefenderClient } from 'paldefender-rest-client';

declare const APP_VERSION: string;

const config = new Conf({ projectName: 'pd-cli' });
const version = APP_VERSION;
const program = new Command();

const _B = "QWRtaW4gVXRpbGl0eSBieSBHbGl0Y2hBcG90YW11cw==";
const getAuthor = () => Buffer.from(_B, 'base64').toString();

function validateIntegrity() {
    const brand = getAuthor();
    if (!brand.includes("GlitchApotamus") || brand.length < 10) {
        console.error(chalk.red.bold("\n🚨 INTEGRITY ERROR: This binary has been tampered with and is no longer functional."));
        process.exit(1);
    }
}

function getClient() {
    validateIntegrity();
    const token = config.get('token') as string;
    const host = config.get('host') as string;
    const port = config.get('port') as string;

    if (!token || !host || !port) {
        console.error(chalk.yellow('\n⚠ Client not configured. Run "pd-cli configure" first.\n'));
        process.exit(1);
    }

    return new PalDefenderClient({ token, host, port: parseInt(port) });
}

const tryParseJson = (input: string | string[]) => {
    const str = Array.isArray(input) ? input.join(' ') : input;
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
};

const handleAction = async (methodName: string, action: () => Promise<any>) => {
    const spinner = ora({ text: `Executing ${methodName}...`, color: 'cyan' }).start();
    try {
        const result = await action();
        spinner.succeed(`API Success: ${methodName}`);
        console.log(boxen(JSON.stringify(result, null, 2), { padding: 0.5, borderColor: 'green' }));
    } catch (error: any) {
        spinner.fail(`API Failure: ${methodName}`);
        console.error(chalk.red(`✖ Error: ${error.message}`));
    }
};

program
    .name('pd-cli')
    .description('PalDefender Management CLI')
    .version(version);

const splashText = `
${chalk.cyan.bold('██████╗ ██████╗       ██████╗██╗     ██╗')}
${chalk.cyan.bold('██╔══██╗██╔══██╗     ██╔════╝██║     ██║')}
${chalk.cyan.bold('██████╔╝██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██╔═══╝ ██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██║     ██████╔╝     ╚██████╗███████╗██║')}
${chalk.cyan.bold('╚═╝     ╚═════╝       ╚═════╝╚══════╝╚═╝')}

      ${chalk.grey(getAuthor())}
`;

program.addHelpText('before', boxen(splashText, {
    padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan',
    title: `PD-CLI v${version}`, titleAlignment: 'center'
}));

program
    .command('configure')
    .description('Interactively save your server connection details')
    .action(async () => {
        console.log(chalk.cyan('\n⚙️  Global Configuration Setup\n'));

        const token = await input({
            message: 'Enter your PalDefender Admin Token:',
            default: (config.get('token') as string) || process.env.PD_TOKEN || ""
        });

        const host = await input({
            message: 'Enter Server Host/IP:',
            default: (config.get('host') as string) || process.env.PD_HOST || '127.0.0.1'
        });

        const port = await input({
            message: 'Enter Server Port:',
            default: (config.get('port') as string) || process.env.PD_PORT || '17993'
        });

        config.set('token', token);
        config.set('host', host);
        config.set('port', port);

        console.log(chalk.green('\n✔ Configuration saved successfully!'));
        console.log(chalk.grey(`Stored at: ${config.path}\n`));
    });

program
    .command('clear-config')
    .description('Remove all saved server connection details')
    .action(() => {
        const spinner = ora('Clearing local configuration...').start();
        try {
            config.clear();
            spinner.succeed(chalk.green('Local configuration wiped successfully.'));
        } catch (error: any) {
            spinner.fail(chalk.red('Failed to clear configuration.'));
        }
    });

program
    .command('test-connection')
    .description('Verify server connectivity and authentication token')
    .action(async () => {
        const spinner = ora({
            text: chalk.blue('Verifying connection to PalDefender...'),
            color: 'cyan'
        }).start();

        try {
            const testClient = getClient();
            const ver = await testClient.version();

            spinner.succeed(chalk.green('Connection Successful!'));

            console.log(boxen(
                `${chalk.white.bold('PalDefender Version:')} ${chalk.cyan(ver.version_str_long)}\n` +
                `${chalk.white.bold('Target:')} ${chalk.grey(config.get('host') + ':' + config.get('port'))}`,
                { padding: 1, borderStyle: 'single', borderColor: 'green' }
            ));

        } catch (error: any) {
            spinner.fail(chalk.red(`Connection Failed: ${error.message}`));

            if (error.message.includes('status 0')) {
                console.log(chalk.yellow('\n👉 Note: ') + chalk.white('Ensure your Palworld server is online and Paldefender is installed correctly.'));
                console.log(chalk.grey('Check that your Host/IP and Port are correct in "pd-cli configure".\n'));
            }
            else if (error.message.includes('401')) {
                console.log(chalk.yellow('\n👉 Note: ') + chalk.white('Authentication failed. Please verify your Admin Token is correct.'));
            }
        }
    });

program
    .command('getVersion')
    .description('Get detailed version info for the server and anticheat.')
    .action(() => handleAction('getVersion', () => getClient().getVersion()));

program
    .command('getPlayers')
    .description('List all players currently or previously registered on the server.')
    .action(() => handleAction('getPlayers', () => getClient().getPlayers()));

program
    .command('getGuilds')
    .description('List all guilds and groups registered on the server.')
    .action(() => handleAction('getGuilds', () => getClient().getGuilds()));

program
    .command('getPlayer')
    .description('Retrieve a detailed profile for a specific player.')
    .argument('<id>', 'The PlayerUID, SteamID, or UserID')
    .action((id) => handleAction('getPlayer', () => getClient().getPlayer(id)));

program
    .command('getPals')
    .description('List all Pals (Team, Palbox, and Base) owned by a player.')
    .argument('<playerId>', 'The PlayerUID or SteamID')
    .action((id) => handleAction('getPals', () => getClient().getPals(id)));

program
    .command('getItems')
    .description('View a player\'s full inventory including weapons and armor.')
    .argument('<playerId>', 'The PlayerUID or SteamID')
    .action((id) => handleAction('getItems', () => getClient().getItems(id)));

program
    .command('getTechs')
    .description('List all researchable and unlocked technology IDs for a player.')
    .argument('<playerId>', 'The PlayerUID or SteamID')
    .action((id) => handleAction('getTechs', () => getClient().getTechs(id)));

program
    .command('getProgression')
    .description('View player stats, capture history, and boss activity.')
    .argument('<playerId>', 'The PlayerUID or SteamID')
    .action((id) => handleAction('getProgression', () => getClient().getProgression(id)));

program
    .command('findPlayerByName')
    .description('Search for a player by their exact in-game name (Case Sensitive).')
    .argument('<name>', 'The exact player name')
    .action((name) => handleAction('findPlayerByName', () => getClient().findPlayerByName(name)));

program
    .command('findPlayersByPartialName')
    .description('Search for players using a name fragment.')
    .argument('<part>', 'Any part of the player name')
    .action((part) => handleAction('findPlayersByPartialName', () => getClient().findPlayersByPartialName(part)));

program
    .command('getGuild')
    .description('Retrieve detailed info and item storage for a specific guild.')
    .argument('<guildId>', 'The unique Guild GUID')
    .action((id) => handleAction('getGuild', () => getClient().getGuild(id)));

program
    .command('deleteBase')
    .description('Immediately delete a base camp from the world.')
    .argument('<baseId>', 'The unique Base GUID')
    .action((id) => handleAction('deleteBase', () => getClient().deleteBase(id)));

program
    .command('giveItems')
    .description('Grant items. Supports names (Stone Wood) or JSON array.')
    .argument('<playerId>', 'Target Player ID')
    .argument('<items...>', 'Item Names OR [{"ItemID":"Wood","Count":10}]')
    .action((playerId, items) => handleAction('giveItems', () => {
        const inputStr = items.join(' ');
        try {
            const parsed = JSON.parse(inputStr);
            if (Array.isArray(parsed)) return getClient().giveItems(playerId, ...parsed);
        } catch (e) { }
        return getClient().giveItems(playerId, ...items);
    }));

program
    .command('givePals')
    .description('Grant Pals. Supports names (Lamball) or JSON object.')
    .argument('<playerId>', 'Target Player ID')
    .argument('<pals...>', 'Pal Names OR {"PalName":"Anubis","Level":1}')
    .action((playerId, pals) => handleAction('givePals', () => {
        const inputStr = pals.join(' ');
        try {
            const parsed = JSON.parse(inputStr);
            return getClient().givePals(playerId, parsed);
        } catch (e) { }
        return getClient().givePals(playerId, ...pals);
    }));

program
    .command('givePalEggs')
    .description('Grant Eggs. Supports IDs or JSON array.')
    .argument('<playerId>', 'Target Player ID')
    .argument('<eggs...>', 'Egg IDs OR ["PalEgg_Dark_01"]')
    .action((playerId, eggs) => handleAction('givePalEggs', () => {
        const inputStr = eggs.join(' ');
        try {
            const parsed = JSON.parse(inputStr);
            if (Array.isArray(parsed)) return getClient().givePalEggs(playerId, ...parsed);
        } catch (e) { }
        return getClient().givePalEggs(playerId, ...eggs);
    }));

program
    .command('giveProgression')
    .description('Update player progression stats (Lifmunks, EXP, Tech Points).')
    .argument('<playerId>', 'SteamID or PlayerUID')
    .argument('<json...>', 'JSON: {"exp": 5000, "technologyPoints": 10}')
    .addHelpText('after', `
The object can contain any of these keys:
  - lifmunks (Number)
  - exp (Number)
  - technologyPoints (Number)
  - ancientTechnologyPoints (Number)

Example:
  $ pd-cli giveProgression "PLAYER_ID" '{"exp": 10000, "lifmunks": 10}'
    `)
    .action((playerId, jsonParts) => handleAction('giveProgression', () => {
        const inputStr = jsonParts.join(' ');
        const data = tryParseJson(inputStr);

        if (typeof data !== 'object' || data === null) {
            throw new Error('Progression data must be a valid JSON object. Example: \'{"exp": 100}\'');
        }

        return getClient().giveProgression(playerId, data);
    }));

program
    .command('giveRecipeMaterials')
    .description('Grant all materials needed to craft a specific item.')
    .argument('<playerId>', 'SteamID or PlayerUID')
    .argument('<product>', 'Internal Item Name (e.g., PalSphere)')
    .argument('<quantity>', 'How many sets of materials to give', (val) => parseInt(val))
    .action((id, prod, qty) => handleAction('giveRecipeMaterials', () => {
        return getClient().giveRecipeMaterials(id, prod, qty);
    }));

program
    .command('learnTech')
    .description('Instantly unlock a specific technology ID.')
    .argument('<playerId>', 'SteamID or PlayerUID')
    .argument('<techId>', 'Internal Tech ID (e.g., Unlock_Sphere_Tier_03)')
    .action((id, tech) => handleAction('learnTech', () => getClient().learnTech(id, tech)));

program
    .command('forgetTech')
    .description('Lock a technology ID, or use "All" to reset the entire tree.')
    .argument('<playerId>', 'SteamID or PlayerUID')
    .argument('<techId>', 'Internal Tech ID or "All"')
    .action((id, tech) => handleAction('forgetTech', () => getClient().forgetTech(id, tech)));

program.addHelpText('after', `
${chalk.yellow.bold('Note on JSON Arguments:')}
When passing JSON (for admin commands), wrap the entire block in single quotes:
  ${chalk.cyan("pd-cli admin giveProgression \"ID\" '{\"exp\": 100}'")}
`);
export default program;