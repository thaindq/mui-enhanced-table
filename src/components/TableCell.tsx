import { TableCell, Theme, withStyles } from '@material-ui/core';

export default withStyles((theme: Theme) => ({
    root: {
        padding: '4px 16px',
    }
}))(TableCell);

const HeaderCell = withStyles((theme: Theme) => ({
    root: {
        padding: '4px 16px',
        textTransform: 'uppercase'
    },
    head: {
        // backgroundColor: theme.palette.common.black,
    },
    body: {
        fontSize: 14,        
    },
}), { name: "MuiTableCell" })(TableCell);

export { HeaderCell };
