import classNames from 'classnames/bind';
import styles from './SlideHome.module.scss';

import { Swiper, SwiperSlide } from 'swiper/react';

import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';

import Banner1 from '../../../assets/images/banner1.jpg';
import Banner2 from '../../../assets/images/banner2.jpg';
import Banner3 from '../../../assets/images/banner3.jpg';
import Banner4 from '../../../assets/images/banner4.jpg';
import Banner5 from '../../../assets/images/banner5.jpg';
import Banner6 from '../../../assets/images/banner6.jpg';

const cx = classNames.bind(styles);

function SlideHome() {
    return (
        <div className={cx('wrapper')}>
            <Swiper
                slidesPerView={1}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                }}
                loop={true}
                speed={1000}
                spaceBetween={30}
                effect={'fade'}
                navigation={true}
                pagination={{
                    clickable: true,
                }}
                modules={[EffectFade, Navigation, Pagination, Autoplay]}
                className="mySwiper"
            >
                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner1} />
                </SwiperSlide>
                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner2} />
                </SwiperSlide>
                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner3} />
                </SwiperSlide>
                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner4} />
                </SwiperSlide>

                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner5} />
                </SwiperSlide>

                <SwiperSlide>
                    <img id={cx('banner-image')} src={Banner6} />
                </SwiperSlide>
            </Swiper>
        </div>
    );
}

export default SlideHome;
