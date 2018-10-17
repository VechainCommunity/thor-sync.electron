import { cry } from 'thor-devkit'

function assert(cond: boolean, msg: string) {
    if (!cond) {
        throw new Error(msg)
    }
}

function isHex(str: string) {
    return /^0x[0-9a-f]*$/i.test(str)
}


export function normalizeClauses(clauses: Connex.Vendor.Clause[]) {
    assert(Array.isArray(clauses), 'bad message: expected array')
    return clauses.map((c, i) => {
        c = { ...c }
        c.to = c.to || null
        c.value = c.value || 0
        c.data = c.data || '0x'
        c.desc = c.desc || ''

        if (c.to) {
            assert(cry.isAddress(c.to), `bad message: #${i}.to expected address or null`)
        }

        if (c.value) {
            assert(typeof c.value === 'string' || typeof c.value === 'number',
                `bad message: #${i}.value expected string or number`)
            if (typeof c.value === 'string') {
                assert(isHex(c.value) && c.value.length > 2,
                    `bad message: #${i}.value expected non-negative integer in hex string`)
                c.value = c.value.toLowerCase()
            } else {
                assert(Number.isSafeInteger(c.value) && c.value >= 0,
                    `bad message: #${i} expected non-negative safe integer`)
            }
        }

        assert(isHex(c.data) && c.data.length % 2 === 0,
            `bad message: #${i} expected odd hex string`)

        assert(typeof c.desc === 'string', `bad message: #${i} expected string`)
        return c
    })
}

export function normalizeTxSignOptions(options?: Connex.Vendor.SignOptions<'tx'>) {
    options = { ...(options || {}) }
    options.signer = options.signer || undefined
    options.gas = options.gas || 21000

    if (options.signer) {
        assert(cry.isAddress(options.signer), 'bad options: signer expected address')
    }

    if (options.gas) {
        assert(Number.isSafeInteger(options.gas) && options.gas >= 0,
            'bad options: gas expected non-negative safe integer')
    }
    return options
}