import React from 'react';
import {createStyles} from "antd-style";
import {Button} from "antd";
import {AntDesignOutlined, CameraOutlined, DownloadOutlined, FileSearchOutlined} from "@ant-design/icons";
const useStyle = createStyles(({ prefixCls, css }) => ({
	linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: linear-gradient(135deg, #6253e1, #04befe);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}));

interface UploadButtonProps {
	name: string;
	buttonType: string;
	onClick: () => void;
	disabled: boolean;
}


// 渐变色按钮
const UploadButton: React.FC<UploadButtonProps> = ({ onClick, name, buttonType, disabled }) => {
	const { styles } = useStyle();
	// 根据传入的buttonType判断按钮的icon
	let icon;
	switch (buttonType) {
		case 'upload':
			icon = <AntDesignOutlined />;
			break;
		case 'download':
			icon = <DownloadOutlined />;
			break;
		case 'ocr':
			icon = <FileSearchOutlined />;
			break;
		case 'screenshot':
			icon = <CameraOutlined />;
			break;
		default:
			icon = <AntDesignOutlined />;
	}

	return(
	<Button
		icon={icon}
		type="primary"
		size="large"
		block
		className={styles.linearGradientButton}
		//onClick为父组件传递的方法
		onClick={onClick}
		disabled={disabled}
	>
		{name}
	</Button>
	)
}
export default UploadButton;