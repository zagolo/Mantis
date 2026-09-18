// ruleid: software-factory.anti-slop.focused-test
test.only("focused", () => true);

// ruleid: software-factory.anti-slop.focused-test
fit("focused", () => true);

// ok: software-factory.anti-slop.focused-test
test("normal", () => true);
