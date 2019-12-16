import { withInfo } from '@storybook/addon-info';
import { addDecorator, configure } from '@storybook/react';

addDecorator(withInfo); 

// automatically import all files ending in *.stories.js
configure(require.context('../stories', true, /\.stories\.(j|t)sx?$/), module);
