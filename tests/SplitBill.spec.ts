import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Address, SendMode, beginCell, fromNano, toNano } from '@ton/core';
import {} from '@ton/ton';
import { SplitBill } from '../wrappers/SplitBill';
import '@ton/test-utils';

describe('SplitBill', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let splitBill: SandboxContract<SplitBill>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        splitBill = blockchain.openContract(await SplitBill.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await splitBill.send(
            deployer.getSender(),
            {
                value: toNano(0.05),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: splitBill.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and splitBill are ready to use
    });

    it('should receive 1 TON', async () => {
        const treasurer = await blockchain.treasury('treasury');
        const res = await treasurer.send({
            to: splitBill.address,
            value: toNano(1),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        console.log({
            splitBillBalance: fromNano(await splitBill.getBalance()), // TODO: TON is deducted, not exactly 1 TON
        });

        expect(res.transactions).toHaveTransaction({
            from: treasurer.address,
            to: splitBill.address,
            value: toNano(1),
            success: true,
        });
    });

    it('should split the bills', async () => {
        const forwardTo = Address.parse('UQCfu4NxQ4kKtNRgK6aZPZkzxijDGcjfJYw1dEDBb0VkmwN5');
        const wallet = await blockchain.treasury('wallet', { balance: toNano(10) });

        // Send TONs for fee
        const treasurer = await blockchain.treasury('treasury');
        await treasurer.send({
            to: splitBill.address,
            value: toNano(1),
        });

        console.log({
            wallet: fromNano(await wallet.getBalance()),
            splitBill: fromNano(await splitBill.getBalance()),
        });

        // Call split function
        const res = await splitBill.send(
            wallet.getSender(),
            {
                value: toNano(1),
            },
            'split',
        );

        console.log({
            wallet: fromNano(await wallet.getBalance()),
            splitBill: fromNano(await splitBill.getBalance()),
        });

        printTransactionFees(res.transactions);

        expect(res.transactions).toHaveTransaction({
            from: wallet.address,
            to: splitBill.address,
            value: toNano(1),
            success: true,
        });
        expect(res.transactions).toHaveTransaction({
            from: splitBill.address,
            to: wallet.address,
            value: toNano(0.999),
            success: true,
        });
        expect(res.transactions).toHaveTransaction({
            from: splitBill.address,
            to: forwardTo,
            value: toNano(0.001),
            // success: true, <== should be true
        });
    });
});
