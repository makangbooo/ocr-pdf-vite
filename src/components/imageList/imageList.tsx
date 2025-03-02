import React from 'react';
import {Divider, Flex, Image, Typography} from 'antd';
import UploadButton from "../uploadButton.tsx";

interface ImageItem {
	path: string;
	name: string;
}
interface ImageListProps {
	imageUrlList: ImageItem[]; // 图片 URL 列表
	showDrawer: () => void;
}

const ImageListViewer: React.FC<ImageListProps> = ({ imageUrlList, showDrawer}) => {
	return (
		<div style={{ height: '100%',width:"100%" }}>
			<UploadButton onClick={showDrawer} name={"导入图像"} buttonType={"upload"} disabled={false}/>
			{imageUrlList.length === 0 ?
				<Flex justify="center" align="center" style={{ height: '95%' }}>
				  <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
					原始文件
				  </Typography.Title>
				</Flex>
				:
				imageUrlList.map((data, index) => (
						<>
							<Image
								width={'100%'}
								src={data.path}
								alt={`image-${index}`}
							/>
							<Divider />
						</>
				))
			}

		</div>
	);
};

export default ImageListViewer;