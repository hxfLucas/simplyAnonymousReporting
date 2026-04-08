import React from 'react';
import TableContainer from '@mui/material/TableContainer';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Drop-in replacement for MUI TableContainer that constrains max-width.
 * Accepts all the same props as TableContainer (including polymorphic ones
 * like `component` and `variant`). Override `maxWidth` per-instance as needed.
 */
type Props = React.ComponentPropsWithRef<typeof TableContainer> & {
  /** Max-width of the container. Defaults to 1056px. */
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
  // Allow any extra props from MUI's polymorphic `component` (e.g. `variant` from Paper)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const TableContainerWrapper = React.forwardRef<HTMLDivElement, Props>(
  ({ maxWidth = 1056, sx, ...rest }, ref) => (
    <TableContainer
      ref={ref}
      sx={[
        { maxWidth, width: '100%', mx: 'auto' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  ),
);

TableContainerWrapper.displayName = 'TableContainerWrapper';

export default TableContainerWrapper;
