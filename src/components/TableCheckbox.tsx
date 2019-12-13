import { Checkbox, Theme, withStyles } from '@material-ui/core';

export default withStyles((theme: Theme) => ({
    root: {
        width: 40,
        height: 39,
    }
}), { name: "MuiTableCheckbox" })(Checkbox);