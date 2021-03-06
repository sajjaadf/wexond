import * as React from 'react';
import { observer } from 'mobx-react';

import ToolbarButton from '@app/components/ToolbarButton';
import { BrowserAction } from '@/models/app';
import { StyledBrowserAction, Badge } from './styles';

interface Props {
  browserAction: BrowserAction;
}

@observer
export default class extends React.Component<Props> {
  public render() {
    const { browserAction } = this.props;
    const {
      icon,
      badgeText,
      badgeBackgroundColor,
      badgeTextColor,
    } = browserAction;

    return (
      <StyledBrowserAction>
        <ToolbarButton opacity={1} size={16} icon={icon} />
        {badgeText.trim() !== '' && (
          <Badge background={badgeBackgroundColor} color={badgeTextColor}>
            {badgeText}
          </Badge>
        )}
      </StyledBrowserAction>
    );
  }
}
