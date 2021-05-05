const { ConnectionTCP } = require('node-vmix')
const xml2js = require('xml2js');

module.exports = nodecg => {

    const tallyReplicant = nodecg.Replicant('tally');
    const configReplicant = nodecg.Replicant('config');
    const inputsReplicant = nodecg.Replicant('inputs', {defaultValue: []});

    const connection = new ConnectionTCP('10.16.12.21');

    connection.on('xml', data => {
        xml2js.parseStringPromise(data).then(({vmix}) => {
            tallyReplicant.value = {
                preview: parseInt(vmix.preview[0]),
                program: parseInt(vmix.active[0])
            };

            const allInputs = vmix.inputs[0].input;

            const inputs = configReplicant.value.inputs.map(i => {
                const input = allInputs.find(input => input.$.number == i);
                if (!input) {
                    return null;
                }

                return input.$;
            });

            inputsReplicant.value = inputs;
        }).catch((err) => {
            console.log("xml parsing failed", err);
        });
    });

    connection.on('tally', data => {
        connection.send('XML');
    });
    
    connection.on('connect', () => {
        console.log("connected")
      connection.send('SUBSCRIBE TALLY');
      connection.send('XML');

      setInterval(() => {
        connection.send('XML');
      }, 200);
    });
};
