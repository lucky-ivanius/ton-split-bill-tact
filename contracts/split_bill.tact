import "@stdlib/deploy";

struct Refundable {
    amount: Int as int64;
    take: Int as int64;
}

contract SplitBill with Deployable {

    const taker: Address = address("UQCfu4NxQ4kKtNRgK6aZPZkzxijDGcjfJYw1dEDBb0VkmwN5");

    init() {
    }

    fun refund(value: Int): Refundable {
        let take: Int = value / 1000; // 0.1%
        let refund: Int = value - take;

        return Refundable{ amount: refund, take: take };
    }

    receive() {
        dump("funds received");
    }

    receive("split") {
        let refund: Refundable = self.refund(context().value);

        send(SendParameters{
            to: self.taker,
            value: refund.take,
            mode: SendPayGasSeparately
        });

        send(SendParameters{
            to: sender(),
            value: refund.amount,
            mode: SendPayGasSeparately
        });
    }

    get fun balance(): Int {
        return myBalance();
    }
}