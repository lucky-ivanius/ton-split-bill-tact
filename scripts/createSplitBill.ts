import { Address, toNano } from '@ton/core';
import { SplitBill } from '../wrappers/SplitBill';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('SplitBill address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const splitBill = provider.open(SplitBill.fromAddress(address));

    await splitBill.send(
        provider.sender(),
        {
            value: toNano(0.1),
        },
        'split',
    );

    ui.write('Waiting for amount to split...');
    ui.clearActionPrompt();
    ui.write('Split executed successfully!');
}
