import { Radio, Theme, withStyles } from '@material-ui/core';

export default withStyles((theme: Theme) => ({
    root: {
        width: 40,
        height: 39,
        padding: 0,
    }
}), { name: 'MuiTableRadio' })(Radio);