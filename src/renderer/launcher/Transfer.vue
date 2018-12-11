<template>
    <v-layout column align-center>
        <v-layout column align-center style="max-width:1000px;width:100%;" pa-3>
            <div class="subheading py-4">Transfer from</div>
            <WalletSeeker style="width:270px" full-size :wallets="wallets" v-model="from"/>
            <v-card flat tile style="width:500px;" class="mt-4 py-2 px-2 outline">
                <v-card-title class="subheading">To</v-card-title>
                <v-card-text>
                    <v-form ref="form">
                        <v-menu
                            v-model="showHistory"
                            style="width:100%;"
                            class="unset-cursor"
                            :open-on-click="false"
                            offset-y
                            :nudge-bottom="-18"
                        >
                            <v-text-field
                                ref="address"
                                slot="activator"
                                :rules="addressRules"
                                validate-on-blur
                                label="Recipient Address"
                                v-model="to"
                                append-icon="mdi-history"
                                @click:append="onClickHistoryIcon"
                            />
                            <v-list two-line>
                                <template v-for="(item,i) in history">
                                    <v-divider v-if="i>0" :key="item.addr + '-divider'"/>
                                    <v-list-tile :key="item.addr" @click="selectAddress(item.addr)">
                                        <v-list-tile-content>
                                            <v-list-tile-title>{{item.addr}}</v-list-tile-title>
                                            <v-list-tile-sub-title v-show="!!item.walletName">
                                                <v-layout align-center>
                                                    <AddressLabel
                                                        icon
                                                        class="mr-2"
                                                        style="width:30px;height:20px;border-radius:3px;"
                                                    >{{item.addr}}</AddressLabel>
                                                    {{item.walletName}}
                                                </v-layout>
                                            </v-list-tile-sub-title>
                                        </v-list-tile-content>
                                    </v-list-tile>
                                </template>
                            </v-list>
                        </v-menu>
                        <v-text-field
                            validate-on-blur
                            type="number"
                            label="Amount"
                            suffix="VET"
                            :rules="amountRules"
                            v-model.number="amount"
                        />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <div class="error--text">{{errMsg}}</div>
                    <v-spacer/>
                    <v-btn flat class="primary" @click="send">Send</v-btn>
                </v-card-actions>
            </v-card>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { State } from 'vuex-class';
import { Entities } from '@/renderer/database';
import BigNumber from 'bignumber.js'
import { cry } from 'thor-devkit'

@Component
export default class Transfer extends Vue {
    @State wallets!: Entities.Wallet[]
    amount = 0
    to = ''
    from = 0
    errMsg = ''
    showHistory = false
    history: {
        addr: string
        walletName: string | null
    }[] = []

    readonly addressRules = [
        (v: string) => !!v || 'Input address here',
        (v: string) => cry.isAddress(v) || 'Invalid address',
        (v: string) => v.toLowerCase() === v || cry.toChecksumAddress(v) === v || 'Checksum incorrect'
    ]
    readonly amountRules = [
        (v: number) => v >= 0 || 'Invalid amount'
    ]

    created() {
        let fromAddr = this.$route.query['from']
        if (fromAddr) {
            fromAddr = fromAddr.toLowerCase()
            const index = this.wallets.findIndex(wallet => wallet.address === fromAddr)
            if (index >= 0) {
                this.from = index
            }
        }
    }

    async send() {
        this.errMsg = ''
        if (!(this.$refs.form as any).validate()) {
            return
        }
        try {
            const value = '0x' + new BigNumber('1' + '0'.repeat(18)).times(this.amount).integerValue().toString(16)
            await connex.vendor.sign('tx').signer(this.wallets[this.from].address!).request([{
                to: this.to,
                value,
                data: '0x'
            }])
            this.$router.back()
        } catch (err) {
            this.errMsg = `${err.name}: ${err.message}`
        }
    }

    async onClickHistoryIcon() {
        if (this.showHistory) {
            this.showHistory = false
            return
        }
        const txs = await BDB.txRecords
            .reverse()
            .limit(20)
            .toArray()

        const addrs: string[] = []
        txs.map(tx => tx.receipt ? tx.receipt.outputs : [])
            .forEach(outputs => {
                outputs.forEach(output => {
                    output.transfers.forEach(tr => {
                        if (addrs.indexOf(tr.recipient) < 0) {
                            addrs.push(tr.recipient)
                        }
                    })
                })
            })

        this.history = addrs.slice(0, 10)
            .map<Transfer['history'][number]>(addr => {
                const wallet = this.wallets.find(wallet => addr === wallet.address)
                if (wallet) {
                    return {
                        addr: cry.toChecksumAddress(addr),
                        walletName: wallet.name!
                    }
                } else {
                    return {
                        addr: cry.toChecksumAddress(addr),
                        walletName: null
                    }
                }
            });
        (this.$refs.address as Vue).$el.querySelector('input')!.focus()
        this.showHistory = true
    }

    selectAddress(addr: string) {
        this.to = addr;
        (this.$refs.address as Vue).$el.querySelector('input')!.focus()
    }
}
</script>

<style scoped>
.unset-cursor >>> * {
    cursor: unset;
}
</style>
