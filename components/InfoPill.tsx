const InfoPill = ( { text, image }: InfoPillProps) => {
    return (
        <figure className='info-pill'>
            <img src={image} alt='info' className='size-5'/>
            <figcaption>{text}</figcaption>
        </figure>
    )
}
export default InfoPill
